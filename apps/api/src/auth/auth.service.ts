import {
  Injectable, UnauthorizedException, ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { v4 as uuid } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '@ponto/types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma:  PrismaService,
    private readonly jwt:     JwtService,
    private readonly cfg:     ConfigService,
  ) {}

  async validateEmployee(email: string, password: string) {
    const emp = await this.prisma.employee.findUnique({ where: { email } });
    if (!emp || !emp.active) throw new UnauthorizedException('Credenciais inválidas');
    const valid = await argon2.verify(emp.passwordHash, password);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');
    return emp;
  }

  async login(employee: { id: string; email: string; role: string }) {
    const payload: JwtPayload = {
      sub:   employee.id,
      email: employee.email,
      role:  employee.role as any,
    };

    const accessToken  = this.jwt.sign(payload);
    const refreshToken = uuid();
    const expiresAt    = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.prisma.refreshToken.create({
      data: { token: refreshToken, employeeId: employee.id, expiresAt },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.getExpiresInSeconds(),
    };
  }

  async refresh(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where:   { token: refreshToken },
      include: { employee: true },
    });

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new ForbiddenException('Refresh token inválido ou expirado');
    }
    if (!stored.employee.active) {
      throw new ForbiddenException('Conta desativada');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data:  { revoked: true },
    });

    return this.login(stored.employee);
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data:  { revoked: true },
    });
  }

  async hashPassword(password: string) {
    return argon2.hash(password);
  }

  private getExpiresInSeconds(): number {
    const expiry = this.cfg.get<string>('JWT_EXPIRES_IN', '15m');
    const match  = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 900;
    const [, val, unit] = match;
    const mult: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    return parseInt(val) * mult[unit];
  }
}
