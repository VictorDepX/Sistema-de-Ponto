import { Injectable } from '@nestjs/common';
import {
  IsUUID, IsString, IsNumber, IsArray, ArrayNotEmpty, Min, Max,
} from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

export class CreateScheduleDto {
  @IsUUID()                        employeeId:    string;
  @IsString()                      expectedStart: string;
  @IsString()                      expectedEnd:   string;
  @IsNumber() @Min(0) @Max(480)    breakMinutes:  number;
  @IsArray() @ArrayNotEmpty()      weekdays:      number[];
}

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateScheduleDto) {
    // Deactivate existing active schedules first
    await this.prisma.workSchedule.updateMany({
      where: { employeeId: dto.employeeId, active: true },
      data:  { active: false },
    });

    return this.prisma.workSchedule.create({ data: dto });
  }

  async findByEmployee(employeeId: string) {
    return this.prisma.workSchedule.findFirst({
      where: { employeeId, active: true },
    });
  }
}
