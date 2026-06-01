import { Injectable, NotFoundException } from '@nestjs/common';
import { IsUUID, IsDateString, IsString } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService }  from '../audit/audit.service';

export class CreateAdjustmentDto {
  @IsUUID()        timeEntryId: string;
  @IsDateString()  newValue:    string;
  @IsString()      reason:      string;
}

@Injectable()
export class AdjustmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit:  AuditService,
  ) {}

  async create(dto: CreateAdjustmentDto, approvedBy: string) {
    const entry = await this.prisma.timeEntry.findUnique({
      where: { id: dto.timeEntryId },
    });
    if (!entry) throw new NotFoundException('Registro não encontrado');

    const oldValue = entry.timestamp;

    const [adjustment] = await this.prisma.$transaction([
      this.prisma.adjustment.create({
        data: {
          timeEntryId: dto.timeEntryId,
          oldValue,
          newValue:    new Date(dto.newValue),
          reason:      dto.reason,
          approvedBy,
        },
      }),
      this.prisma.timeEntry.update({
        where: { id: dto.timeEntryId },
        data:  { timestamp: new Date(dto.newValue), manualEdit: true },
      }),
    ]);

    await this.audit.log({
      entity:      'TimeEntry',
      entityId:    dto.timeEntryId,
      action:      'ADJUSTMENT',
      oldValue:    { timestamp: oldValue.toISOString() },
      newValue:    { timestamp: dto.newValue, reason: dto.reason },
      performedBy: approvedBy,
    });

    return adjustment;
  }

  async findByEntry(timeEntryId: string) {
    return this.prisma.adjustment.findMany({
      where:   { timeEntryId },
      include: { approver: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
