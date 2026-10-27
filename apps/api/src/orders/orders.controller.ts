import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { OrdersService } from './orders.service';
import { CurrentUser, Roles } from '../auth/auth.decorators';
import { RolesGuard } from '../auth/roles.guard';
import { OrderEstado, Rol } from '@prisma/client';

class TransitionDto {
  @IsIn(['EN_ATENCION', 'COMPLETADA', 'CANCELADA'])
  estado: OrderEstado;

  @IsOptional()
  @IsString()
  comentario?: string;
}

@UseGuards(AuthGuard('jwt'))
@Controller('orders')
export class OrdersController {
  constructor(private service: OrdersService) {}

  @Get('me')
  listMine(@CurrentUser() user: any) {
    return this.service.listMine(user);
  }

  @UseGuards(RolesGuard)
  @Roles(Rol.ADMIN)
  @Get('all')
  listAll() {
    return this.service.listAll();
  }

  @UseGuards(RolesGuard)
  @Roles(Rol.ESPECIALISTA, Rol.ADMIN)
  @Post(':id/estado')
  transition(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: TransitionDto) {
    return this.service.transition(user, id, dto.estado, dto.comentario || '');
  }
}
