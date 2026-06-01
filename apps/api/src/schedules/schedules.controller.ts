import {
  Controller, Post, Get, Body, Param, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard }   from '../common/guards/roles.guard';
import { Roles }        from '../common/decorators';
import { Role }         from '@ponto/types';
import { SchedulesService, CreateScheduleDto } from './schedules.service';

@ApiTags('schedules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly service: SchedulesService) {}

  @Post()
  @ApiOperation({ summary: '[ADMIN] Definir escala de trabalho' })
  create(@Body() dto: CreateScheduleDto) {
    return this.service.create(dto);
  }

  @Get(':employeeId')
  @ApiOperation({ summary: '[ADMIN] Escala ativa de um funcionário' })
  findByEmployee(@Param('employeeId', ParseUUIDPipe) employeeId: string) {
    return this.service.findByEmployee(employeeId);
  }
}
