import {
  Injectable, ConflictException, NotFoundException,
} from '@nestjs/common';
import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { Role } from '@ponto/types';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService }   from '../auth/auth.service';
import { AuditService }  from '../audit/audit.service';

export class CreateEmployeeDto {
  @IsString()               name: string;
  @IsEmail()                email: string;
  @IsString() @MinLength(6) password: string;
  @IsEnum(Role) @IsOptional() role?: Role;
}

export class UpdateEmployeeDto {
  @IsString()  @IsOptional() name?:   string;
  @IsEmail()   @IsOptional() email?:  string;
  @IsBoolean() @IsOptional() active?: boolean;
}

const SAFE_SELECT = {
  id: true, name: true, email: true,
  role: true, active: true, createdAt: true, updatedAt: true,
} as const;

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth:   AuthService,
    private readonly audit:  AuditService,
  ) {}

  async create(dto: CreateEmployeeDto, performedBy: string) {
    const exists = await this.prisma.employee.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('E-mail já cadastrado');

    const passwordHash = await this.auth.hashPassword(dto.password);

    const employee = await this.prisma.employee.create({
      data: {
        name:  dto.name,
        email: dto.email,
        passwordHash,
        role:  (dto.role ?? Role.EMPLOYEE) as any,
      },
      select: SAFE_SELECT,
    });

    await this.audit.log({
      entity:      'Employee',
      entityId:    employee.id,
      action:      'CREATE',
      newValue:    { name: dto.name, email: dto.email, role: dto.role },
      performedBy,
    });

    return employee;
  }

  async findAll(active?: boolean) {
    return this.prisma.employee.findMany({
      where:   active !== undefined ? { active } : {},
      select:  SAFE_SELECT,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const emp = await this.prisma.employee.findUnique({
      where:  { id },
      select: { ...SAFE_SELECT, schedules: true },
    });
    if (!emp) throw new NotFoundException('Funcionário não encontrado');
    return emp;
  }

  async update(id: string, dto: UpdateEmployeeDto, performedBy: string) {
    const old = await this.findOne(id);

    const emp = await this.prisma.employee.update({
      where:  { id },
      data:   dto,
      select: SAFE_SELECT,
    });

    await this.audit.log({
      entity:      'Employee',
      entityId:    id,
      action:      'UPDATE',
      // Cast to satisfy Record<string, unknown>
      oldValue:    old    as unknown as Record<string, unknown>,
      newValue:    dto    as unknown as Record<string, unknown>,
      performedBy,
    });

    return emp;
  }

  async deactivate(id: string, performedBy: string) {
    const emp = await this.update(id, { active: false }, performedBy);

    await this.prisma.refreshToken.updateMany({
      where: { employeeId: id },
      data:  { revoked: true },
    });

    return emp;
  }

  // Endpoint GET /employees/me — returns own profile
  async findMe(id: string) {
    const emp = await this.prisma.employee.findUnique({
      where:  { id },
      select: SAFE_SELECT,
    });
    if (!emp) throw new NotFoundException('Funcionário não encontrado');
    return emp;
  }
}
