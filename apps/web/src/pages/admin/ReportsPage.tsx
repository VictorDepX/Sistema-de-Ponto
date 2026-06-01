import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi, employeesApi } from '../../services/api';
import { formatMinutes, MONTH_SHORT, MONTH_NAMES, dayOfWeek, ENTRY_LABELS, ENTRY_COLORS } from '@ponto/utils';
import { EntryType } from '@ponto/types';

const now0 = new Date();
const pad  = (n: number) => String(n).padStart(2, '0');
const fmt  = (iso: string) => { const d = new Date(iso); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

export default function ReportsPage() {
  const [month,     setMonth]     = useState(now0.getMonth() + 1);
  const [year,      setYear]      = useState(now0.getFullYear());
  const [selEmpId,  setSelEmpId]  = useState<string>('all');
  const [exporting, setExporting] = useState(false);

  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: employeesApi.list });
  const activeEmps = (employees as any[]).filter(e => e.active);

  const { data: allReports = [], isLoading: loadingAll } = useQuery({
    queryKey: ['all-reports', year, month],
    queryFn:  () => reportsApi.all(year, month),
    enabled:  selEmpId === 'all',
  });

  const { data: empReport, isLoading: loadingEmp } = useQuery({
    queryKey: ['emp-report', selEmpId, year, month],
    queryFn:  () => reportsApi.employee(selEmpId, year, month),
    enabled:  selEmpId !== 'all',
  });

  const handleExport = async () => {
    if (selEmpId === 'all') return;
    setExporting(true);
    try {
      const res  = await reportsApi.exportXlsx(selEmpId, year, month);
      const url  = URL.createObjectURL(new Blob([res.data]));
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `ponto_${selEmpId}_${year}_${month}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally { setExporting(false); }
  };

  const chipBtn = (active: boolean, onClick: () => void, label: string) => (
    <button onClick={onClick} style={{
      padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
      border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
      background: active ? 'var(--accent)' : 'var(--bg2)',
      color: active ? '#fff' : 'var(--text3)',
    }}>{label}</button>
  );

  const thS: React.CSSProperties = { padding: '11px 16px', textAlign: 'left', fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)', letterSpacing: 1, fontWeight: 600 };
  const tdS: React.CSSProperties = { padding: '13px 16px', fontSize: 13 };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text3)', letterSpacing: 2 }}>ANÁLISE</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>Relatórios</h1>
        </div>
        {selEmpId !== 'all' && (
          <button onClick={handleExport} disabled={exporting} style={{ padding: '10px 20px', background: 'var(--green-l)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 'var(--r)', color: 'var(--green)', fontSize: 13, fontWeight: 600 }}>
            {exporting ? '...' : '↓ Exportar XLSX'}
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '18px 20px', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[now0.getFullYear()-1, now0.getFullYear()].map(y =>
            <button key={y} onClick={() => setYear(y)} style={{ padding: '6px 16px', borderRadius: 'var(--r-sm)', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, border: `1px solid ${y === year ? 'var(--accent)' : 'var(--border)'}`, background: y === year ? 'var(--accent-l)' : 'var(--bg2)', color: y === year ? 'var(--accent)' : 'var(--text3)' }}>{y}</button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {MONTH_SHORT.map((m, i) => chipBtn(i+1 === month, () => setMonth(i+1), m))}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {chipBtn(selEmpId === 'all', () => setSelEmpId('all'), 'Todos')}
          {activeEmps.map((e: any) => chipBtn(selEmpId === e.id, () => setSelEmpId(e.id), e.name.split(' ')[0]))}
        </div>
      </div>

      {/* All summary table */}
      {selEmpId === 'all' && (
        <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Funcionário','Dias','Horas','Extras','Atrasos','Faltas','Banco'].map(h => <th key={h} style={thS}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loadingAll && <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Carregando...</td></tr>}
              {(allReports as any[]).map(r => (
                <tr key={r.employee.id} onClick={() => setSelEmpId(r.employee.id)} style={{ borderBottom: '1px solid var(--bg2)', cursor: 'pointer' }}>
                  <td style={tdS}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent-l)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--accent)', fontSize: 13 }}>{r.employee.name[0]}</div>
                      <span style={{ fontWeight: 500 }}>{r.employee.name}</span>
                    </div>
                  </td>
                  <td style={{ ...tdS, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>{r.days.filter((d: any) => !d.isAbsent).length}</td>
                  <td style={{ ...tdS, fontFamily: 'var(--mono)', color: 'var(--accent)', fontWeight: 700 }}>{formatMinutes(r.totalWorkedMinutes)}</td>
                  <td style={{ ...tdS, fontFamily: 'var(--mono)', color: 'var(--green)' }}>{formatMinutes(r.totalOvertimeMinutes)}</td>
                  <td style={{ ...tdS, fontFamily: 'var(--mono)', color: 'var(--yellow)' }}>{formatMinutes(r.totalLateMinutes)}</td>
                  <td style={{ ...tdS, fontFamily: 'var(--mono)', color: r.totalAbsences > 0 ? 'var(--red)' : 'var(--text3)' }}>{r.totalAbsences}</td>
                  <td style={{ ...tdS, fontFamily: 'var(--mono)', fontWeight: 700, color: r.bankMinutes >= 0 ? 'var(--green)' : 'var(--red)' }}>{r.bankMinutes >= 0 ? '+' : ''}{formatMinutes(r.bankMinutes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Single employee */}
      {selEmpId !== 'all' && empReport && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Horas trabalhadas', val: formatMinutes(empReport.totalWorkedMinutes),   color: 'var(--accent)' },
              { label: 'Horas extras',      val: formatMinutes(empReport.totalOvertimeMinutes), color: 'var(--green)'  },
              { label: 'Atrasos',           val: formatMinutes(empReport.totalLateMinutes),     color: 'var(--yellow)' },
              { label: 'Banco de horas',    val: (empReport.bankMinutes >= 0 ? '+' : '') + formatMinutes(empReport.bankMinutes), color: empReport.bankMinutes >= 0 ? 'var(--green)' : 'var(--red)' },
            ].map(item => (
              <div key={item.label} style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 18 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 24, fontWeight: 700, color: item.color }}>{item.val}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 5 }}>{item.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {empReport.days.map((day: any) => (
              <div key={day.date} style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: day.entries.length > 0 ? 10 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{dayOfWeek(day.date)}, {day.date.split('-').reverse().join('/')}</span>
                    {day.isAbsent && <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--red)', background: 'var(--red-l)', padding: '2px 7px', borderRadius: 4 }}>FALTA</span>}
                    {day.lateMinutes > 0 && <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--yellow)', background: 'var(--yellow-l)', padding: '2px 7px', borderRadius: 4 }}>+{formatMinutes(day.lateMinutes)}</span>}
                  </div>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{formatMinutes(day.workedMinutes)}</span>
                </div>
                {day.entries.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {day.entries.map((e: any) => (
                      <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 'var(--r-sm)', background: 'var(--bg2)', border: `1px solid ${ENTRY_COLORS[e.type as EntryType]}30` }}>
                        <span style={{ fontSize: 10, color: ENTRY_COLORS[e.type as EntryType] }}>●</span>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, color: ENTRY_COLORS[e.type as EntryType] }}>{fmt(e.timestamp)}</span>
                        <span style={{ fontSize: 10, color: 'var(--text3)' }}>{ENTRY_LABELS[e.type as EntryType]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
