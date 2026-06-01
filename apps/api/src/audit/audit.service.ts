import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditLogDto {
  entity:      string;
  entityId:    string;
  action:      string;
  oldValue?:   Record<string, unknown> | null;
  newValue?:   Record<string, unknown> | null;
  performedBy: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  // `as any` needed: Prisma XOR type conflicts with plain object shape
  async log(dto: AuditLogDto) {
    return this.prisma.auditLog.create({ data: dto as any });
  }

  async findAll(
    entity?: string,
    entityId?: string,
    page  = 1,
    limit = 50,
  ) {
    const where: Record<string, unknown> = {};
    if (entity)   where['entity']   = entity;
    if (entityId) where['entityId'] = entityId;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * limit,
        take:    limit,
        include: {
          performer: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
