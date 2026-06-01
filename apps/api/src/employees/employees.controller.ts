import {
  Controller, Get, Post, Patch, Delete, Body,
  Param, Query, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard }   from '../common/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators';
import { Role }         from '@ponto/types';
import {
  EmployeesService, CreateEmployeeDto, UpdateEmployeeDto,
} from './employees.service';

@ApiTags('employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly service: EmployeesService) {}

  // Must come before :id to avoid ParseUUIDPipe treating "me" as UUID
  @Get('me')
  @ApiOperation({ summary: 'Meu perfil' })
  me(@CurrentUser() user: any) {
    return this.service.findMe(user.id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Cadastrar funcionário' })
  create(@Body() dto: CreateEmployeeDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiOperation({ summary: '[ADMIN] Listar funcionários' })
  findAll(@Query('active') active?: string) {
    const filter = active === undefined ? undefined : active === 'true';
    return this.service.findAll(filter);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Buscar funcionário por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Atualizar funcionário' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user.id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[ADMIN] Desativar funcionário' })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.service.deactivate(id, user.id);
  }
}
