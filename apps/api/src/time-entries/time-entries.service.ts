import {
  Injectable, BadRequestException, ConflictException,
} from '@nestjs/common';
import { IsEnum, IsString, IsOptional, IsDateString } from 'class-validator';
import { EntryType } from '@ponto/types';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService }  from '../audit/audit.service';

export class CreateTimeEntryDto {
  @IsEnum(EntryType)          type:      EntryType;
  @IsDateString()             timestamp: string;
  @IsString()                 timezone:  string;
  @IsString() @IsOptional()   deviceId?: string;
}

// Ordered sequence — must match Prisma enum values exactly
const ENTRY_ORDER = [
  'CLOCK_IN',
  'BREAK_START',
  'BREAK_END',
  'CLOCK_OUT',
] as const;

type PrismaEntryType = typeof ENTRY_ORDER[number];

@Injectable()
export class TimeEntriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit:  AuditService,
  ) {}

  async punch(employeeId: string, dto: CreateTimeEntryDto) {
    await this.validateSequence(
      employeeId,
      dto.type as PrismaEntryType,
      new Date(dto.timestamp),
    );

    const entry = await this.prisma.timeEntry.create({
      data: {
        employeeId,
        type:      dto.type as PrismaEntryType,
        timestamp: new Date(dto.timestamp),
        timezone:  dto.timezone,
        deviceId:  dto.deviceId ?? null,
      },
    });

    await this.audit.log({
      entity:      'TimeEntry',
      entityId:    entry.id,
      action:      'CREATE',
      newValue:    { type: dto.type, timestamp: dto.timestamp },
      performedBy: employeeId,
    });

    return entry;
  }

  async findByEmployee(employeeId: string, from?: string, to?: string) {
    return this.prisma.timeEntry.findMany({
      where: {
        employeeId,
        ...(from || to
          ? {
              timestamp: {
                gte: from ? new Date(from) : undefined,
                lte: to   ? new Date(to)   : undefined,
              },
            }
          : {}),
      },
      orderBy: { timestamp: 'asc' },
    });
  }

  async getStatus(employeeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const entries = await this.prisma.timeEntry.findMany({
      where:   { employeeId, timestamp: { gte: today } },
      orderBy: { timestamp: 'asc' },
    });

    const last = entries[entries.length - 1];
    let nextType: PrismaEntryType | null = 'CLOCK_IN';

    if (last) {
      const idx = ENTRY_ORDER.indexOf(last.type as PrismaEntryType);
      nextType  = idx >= 0 && idx < ENTRY_ORDER.length - 1
        ? ENTRY_ORDER[idx + 1]
        : null;
    }

    return { entries, nextType, lastEntry: last ?? null };
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private async validateSequence(
    employeeId: string,
    type: PrismaEntryType,
    at: Date,
  ) {
    const dayStart = new Date(at);
    dayStart.setHours(0, 0, 0, 0);

    const existing = await this.prisma.timeEntry.findMany({
      where:   { employeeId, timestamp: { gte: dayStart } },
      orderBy: { timestamp: 'asc' },
    });

    const last         = existing[existing.length - 1];
    const expectedIdx  = last
      ? ENTRY_ORDER.indexOf(last.type as PrismaEntryType) + 1
      : 0;
    const expectedType = ENTRY_ORDER[expectedIdx] as PrismaEntryType | undefined;

    if (!expectedType) {
      throw new BadRequestException('Expediente já encerrado');
    }
    if (expectedType !== type) {
      throw new ConflictException(
        `Sequência inválida. Esperado: ${expectedType}, recebido: ${type}`,
      );
    }
  }
}
