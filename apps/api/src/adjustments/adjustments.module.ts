import { Module } from '@nestjs/common';
import { AdjustmentsController } from './adjustments.controller';
import { AdjustmentsService }    from './adjustments.service';
import { AuditModule }           from '../audit/audit.module';

@Module({
  imports:     [AuditModule],
  controllers: [AdjustmentsController],
  providers:   [AdjustmentsService],
})
export class AdjustmentsModule {}
