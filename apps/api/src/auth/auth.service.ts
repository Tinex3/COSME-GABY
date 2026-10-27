import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Rol } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('El email ya está registrado');

    const allowed: string[] = [Rol.PACIENTE, Rol.ESPECIALISTA];
    let roles = dto.roles.filter((r) => allowed.includes(r)) as Rol[];
    if (roles.length === 0) roles = [Rol.PACIENTE];

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        nombre: dto.nombre,
        telefono: dto.telefono,
        roles,
        ...(roles.includes(Rol.ESPECIALISTA)
          ? {
              profile: {
                create: {
                  nombrePublico: dto.nombre,
                  bio: 'Especialista en cosmetología.',
                },
              },
            }
          : {}),
      },
      include: { profile: true },
    });

    return this.sign(user.id, user.email, user.nombre, user.roles);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return this.sign(user.id, user.email, user.nombre, user.roles);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: { include: { credential: true } } },
    });
    if (!user) throw new UnauthorizedException();
    const { passwordHash, ...rest } = user;
    return rest;
  }

  private sign(id: string, email: string, nombre: string, roles: Rol[]) {
    const accessToken = this.jwt.sign({ sub: id, email, nombre, roles });
    return { accessToken, user: { id, email, nombre, roles } };
  }
}
