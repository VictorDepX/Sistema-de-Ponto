import { Module } from '@nestjs/common';
import { TimeEntriesController } from './time-entries.controller';
import { TimeEntriesService }    from './time-entries.service';
import { AuditModule }           from '../audit/audit.module';

@Module({
  imports:     [AuditModule],
  controllers: [TimeEntriesController],
  providers:   [TimeEntriesService],
  exports:     [TimeEntriesService],
})
export class TimeEntriesModule {}
