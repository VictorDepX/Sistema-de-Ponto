import {
  Controller, Get, Post, Body, Param, Query,
  UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard }   from '../common/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators';
import { Role }         from '@ponto/types';
import { TimeEntriesService, CreateTimeEntryDto } from './time-entries.service';

@ApiTags('time-entries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('time-entries')
export class TimeEntriesController {
  constructor(private readonly service: TimeEntriesService) {}

  @Post('punch')
  @ApiOperation({ summary: 'Bater ponto' })
  punch(@Body() dto: CreateTimeEntryDto, @CurrentUser() user: any) {
    return this.service.punch(user.id, dto);
  }

  @Get('status')
  @ApiOperation({ summary: 'Status atual do expediente' })
  status(@CurrentUser() user: any) {
    return this.service.getStatus(user.id);
  }

  @Get('my')
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to',   required: false })
  @ApiOperation({ summary: 'Meus registros de ponto' })
  myEntries(
    @CurrentUser() user: any,
    @Query('from') from?: string,
    @Query('to')   to?:   string,
  ) {
    return this.service.findByEmployee(user.id, from, to);
  }

  @Get('employee/:employeeId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to',   required: false })
  @ApiOperation({ summary: '[ADMIN] Registros de um funcionário' })
  employeeEntries(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Query('from') from?: string,
    @Query('to')   to?:   string,
  ) {
    return this.service.findByEmployee(employeeId, from, to);
  }
}
