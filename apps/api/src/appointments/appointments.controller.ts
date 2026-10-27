import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsOptional, IsString, Matches } from 'class-validator';
import { AppointmentsService } from './appointments.service';
import { CurrentUser, Roles } from '../auth/auth.decorators';
import { RolesGuard } from '../auth/roles.guard';
import { Rol } from '@prisma/client';

class BookDto {
  @IsString()
  professionalId: string;

  @IsString()
  treatmentId: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  fecha: string;

  @Matches(/^\d{2}:\d{2}$/)
  hora: string;

  @IsOptional()
  @IsString()
  nota?: string;
}

@UseGuards(AuthGuard('jwt'))
@Controller('appointments')
export class AppointmentsController {
  constructor(private service: AppointmentsService) {}

  @Post()
  book(@CurrentUser('id') userId: string, @Body() dto: BookDto) {
    return this.service.book(userId, dto.professionalId, dto.treatmentId, dto.fecha, dto.hora);
  }

  @Get('me')
  listMine(@CurrentUser() user: any) {
    return this.service.listMine(user);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.transition(user, id, 'cancel');
  }

  @UseGuards(RolesGuard)
  @Roles(Rol.ESPECIALISTA, Rol.ADMIN)
  @Post(':id/complete')
  complete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.transition(user, id, 'complete');
  }

  @UseGuards(RolesGuard)
  @Roles(Rol.ESPECIALISTA, Rol.ADMIN)
  @Post(':id/noshow')
  noshow(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.transition(user, id, 'noshow');
  }
}
