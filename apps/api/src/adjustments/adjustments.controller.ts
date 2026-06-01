import {
  Controller, Post, Get, Body, Param, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard }   from '../common/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators';
import { Role }         from '@ponto/types';
import { AdjustmentsService, CreateAdjustmentDto } from './adjustments.service';

@ApiTags('adjustments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('adjustments')
export class AdjustmentsController {
  constructor(private readonly service: AdjustmentsService) {}

  @Post()
  @ApiOperation({ summary: '[ADMIN] Ajustar registro de ponto' })
  create(@Body() dto: CreateAdjustmentDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.id);
  }

  @Get('entry/:id')
  @ApiOperation({ summary: '[ADMIN] Histórico de ajustes de um registro' })
  findByEntry(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findByEntry(id);
  }
}
