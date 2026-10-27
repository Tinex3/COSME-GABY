import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsArray, IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';
import { AdminService } from './admin.service';
import { CurrentUser, Roles } from '../auth/auth.decorators';
import { RolesGuard } from '../auth/roles.guard';
import { Rol } from '@prisma/client';

class VerifyDto {
  @IsBoolean()
  approved: boolean;
}

class CreateSpecialistDto {
  @IsString()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(2)
  nombre: string;

  @IsOptional()
  @IsString()
  comuna?: string;

  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  especialidades?: string[];

  @IsOptional()
  @IsBoolean()
  verificado?: boolean;
}

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Rol.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private service: AdminService) {}

  @Get('metrics')
  metrics() {
    return this.service.metrics();
  }

  @Get('kpis')
  kpis() {
    return this.service.kpis();
  }

  @Post('specialists')
  createSpecialist(@Body() dto: CreateSpecialistDto) {
    return this.service.createSpecialist(dto);
  }

  @Get('users')
  users() {
    return this.service.listUsers();
  }

  @Get('credentials')
  credentials() {
    return this.service.listCredentials();
  }

  @Post('profiles/:id/verify')
  verify(@CurrentUser('id') adminId: string, @Param('id') id: string, @Body() dto: VerifyDto) {
    return this.service.verifyProfessional(adminId, id, dto.approved);
  }

  @Get('reviews')
  reviews() {
    return this.service.listReviews();
  }
}
