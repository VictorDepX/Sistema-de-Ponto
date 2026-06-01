import {
  Controller, Get, Param, Query, Res, UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard }   from '../common/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators';
import { Role }         from '@ponto/types';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('my/:year/:month')
  @ApiOperation({ summary: 'Meu relatório mensal' })
  myReport(
    @CurrentUser() user: any,
    @Param('year')  year:  string,
    @Param('month') month: string,
  ) {
    return this.service.monthReport(user.id, +year, +month);
  }

  @Get('employee/:id/:year/:month')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Relatório mensal de um funcionário' })
  employeeReport(
    @Param('id')    id:    string,
    @Param('year')  year:  string,
    @Param('month') month: string,
  ) {
    return this.service.monthReport(id, +year, +month);
  }

  @Get('all/:year/:month')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Resumo de todos os funcionários' })
  allSummary(
    @Param('year')  year:  string,
    @Param('month') month: string,
  ) {
    return this.service.allEmployeesSummary(+year, +month);
  }

  @Get('export/xlsx/:id/:year/:month')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Exportar relatório em XLSX' })
  async exportXlsx(
    @Param('id')    id:    string,
    @Param('year')  year:  string,
    @Param('month') month: string,
    @Res() res: Response,
  ) {
    const buffer = await this.service.exportMonthXlsx(id, +year, +month);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="ponto_${id}_${year}_${month}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
