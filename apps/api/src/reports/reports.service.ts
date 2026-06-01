import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';

// Use string literals to avoid conflict between @ponto/types enum and Prisma enum
const ET = {
  CLOCK_IN:    'CLOCK_IN',
  BREAK_START: 'BREAK_START',
  BREAK_END:   'BREAK_END',
  CLOCK_OUT:   'CLOCK_OUT',
} as const;

const pad = (n: number) => String(n).padStart(2, '0');

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async monthReport(employeeId: string, year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end   = new Date(year, month, 0, 23, 59, 59);

    const [employee, entries, schedule] = await Promise.all([
      this.prisma.employee.findUniqueOrThrow({
        where:  { id: employeeId },
        select: { id: true, name: true, email: true },
      }),
      this.prisma.timeEntry.findMany({
        where:   { employeeId, timestamp: { gte: start, lte: end } },
        orderBy: { timestamp: 'asc' },
      }),
      this.prisma.workSchedule.findFirst({
        where: { employeeId, active: true },
      }),
    ]);

    const byDay = this.groupByDay(entries);
    const daysInMonth    = new Date(year, month, 0).getDate();
    const expectedMinutes = schedule
      ? this.scheduleExpected(schedule.expectedStart, schedule.expectedEnd, schedule.breakMinutes)
      : 480;

    const days: any[] = [];
    let totalWorked = 0, totalOvertime = 0, totalLate = 0, totalAbsences = 0, bank = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr   = `${year}-${pad(month)}-${pad(d)}`;
      const dayEntries = byDay[dateStr] ?? [];
      const weekday   = new Date(dateStr + 'T12:00:00').getDay();
      const isWorkday = schedule
        ? schedule.weekdays.includes(weekday)
        : weekday >= 1 && weekday <= 5;

      if (!isWorkday && dayEntries.length === 0) continue;

      const workedMin   = this.calcWorked(dayEntries);
      const overtimeMin = Math.max(0, workedMin - expectedMinutes);
      const lateMin     = dayEntries.length > 0 && schedule
        ? this.calcLate(dayEntries, schedule.expectedStart)
        : 0;
      const isAbsent    = isWorkday && dayEntries.length === 0;

      totalWorked   += workedMin;
      totalOvertime += overtimeMin;
      totalLate     += lateMin;
      if (isAbsent) totalAbsences++;
      bank += workedMin - (isWorkday ? expectedMinutes : 0);

      days.push({ date: dateStr, entries: dayEntries, workedMinutes: workedMin, overtimeMinutes: overtimeMin, lateMinutes: lateMin, isAbsent });
    }

    return {
      employee, month, year, days,
      totalWorkedMinutes: totalWorked, totalOvertimeMinutes: totalOvertime,
      totalLateMinutes: totalLate, totalAbsences, bankMinutes: bank,
    };
  }

  async allEmployeesSummary(year: number, month: number) {
    const employees = await this.prisma.employee.findMany({
      where:   { active: true },
      select:  { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });
    return Promise.all(employees.map(e => this.monthReport(e.id, year, month)));
  }

  async exportMonthXlsx(employeeId: string, year: number, month: number) {
    const report = await this.monthReport(employeeId, year, month);
    const wb     = new ExcelJS.Workbook();
    const ws     = wb.addWorksheet('Relatório');

    ws.columns = [
      { header: 'Data',       key: 'date',     width: 14 },
      { header: 'Dia',        key: 'day',      width: 10 },
      { header: 'Registros',  key: 'entries',  width: 40 },
      { header: 'Trabalhado', key: 'worked',   width: 14 },
      { header: 'Extras',     key: 'overtime', width: 12 },
      { header: 'Atraso',     key: 'late',     width: 12 },
      { header: 'Falta',      key: 'absent',   width: 10 },
    ];
    ws.getRow(1).font = { bold: true };

    const DAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    for (const day of report.days) {
      const entryStr = (day.entries as any[])
        .map((e: any) => `${this.entryLabel(e.type)} ${this.fmtTime(e.timestamp)}`)
        .join(' | ');

      ws.addRow({
        date:     day.date,
        day:      DAYS[new Date(day.date + 'T12:00:00').getDay()],
        entries:  entryStr,
        worked:   this.fmtMin(day.workedMinutes),
        overtime: this.fmtMin(day.overtimeMinutes),
        late:     this.fmtMin(day.lateMinutes),
        absent:   day.isAbsent ? 'Sim' : '',
      });
    }

    ws.addRow({});
    ws.addRow({
      date:     'TOTAL',
      worked:   this.fmtMin(report.totalWorkedMinutes),
      overtime: this.fmtMin(report.totalOvertimeMinutes),
      late:     this.fmtMin(report.totalLateMinutes),
      absent:   String(report.totalAbsences),
    });

    const buffer = await wb.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private groupByDay(entries: any[]) {
    const map: Record<string, any[]> = {};
    for (const e of entries) {
      const key = (e.timestamp as Date).toISOString().slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(e);
    }
    return map;
  }

  private calcWorked(entries: any[]): number {
    const sorted = [...entries].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    let worked = 0, lastIn: number | null = null;
    for (const e of sorted) {
      const ts = new Date(e.timestamp).getTime();
      if (e.type === ET.CLOCK_IN || e.type === ET.BREAK_END) {
        lastIn = ts;
      } else if ((e.type === ET.BREAK_START || e.type === ET.CLOCK_OUT) && lastIn !== null) {
        worked += (ts - lastIn) / 60000;
        lastIn = null;
      }
    }
    return Math.round(worked);
  }

  private calcLate(entries: any[], expectedStart: string): number {
    const clockIn = entries.find(e => e.type === ET.CLOCK_IN);
    if (!clockIn) return 0;
    const ts = new Date(clockIn.timestamp);
    const [eh, em] = expectedStart.split(':').map(Number);
    const expected  = new Date(ts);
    expected.setHours(eh, em, 0, 0);
    return Math.max(0, Math.round((ts.getTime() - expected.getTime()) / 60000));
  }

  private scheduleExpected(start: string, end: string, breakMin: number): number {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return (eh * 60 + em) - (sh * 60 + sm) - breakMin;
  }

  private fmtTime(ts: Date | string): string {
    const d = new Date(ts);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  private fmtMin(min: number): string {
    const h = Math.floor(Math.abs(min) / 60);
    const m = Math.abs(min) % 60;
    return `${min < 0 ? '-' : ''}${pad(h)}:${pad(m)}`;
  }

  private entryLabel(type: string): string {
    const labels: Record<string, string> = {
      [ET.CLOCK_IN]:    '↗ Entrada',
      [ET.BREAK_START]: '⏸ Intervalo',
      [ET.BREAK_END]:   '▶ Retorno',
      [ET.CLOCK_OUT]:   '↙ Saída',
    };
    return labels[type] ?? type;
  }
}
