import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { PrismaModule }      from './prisma/prisma.module';
import { AuthModule }        from './auth/auth.module';
import { EmployeesModule }   from './employees/employees.module';
import { TimeEntriesModule } from './time-entries/time-entries.module';
import { ReportsModule }     from './reports/reports.module';
import { AdjustmentsModule } from './adjustments/adjustments.module';
import { SchedulesModule }   from './schedules/schedules.module';
import { AuditModule }       from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),

    PrismaModule,
    AuthModule,
    EmployeesModule,
    TimeEntriesModule,
    ReportsModule,
    AdjustmentsModule,
    SchedulesModule,
    AuditModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
