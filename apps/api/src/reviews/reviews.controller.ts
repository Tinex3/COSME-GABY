import { Body, Controller, Delete, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsInt, IsString, Max, Min } from 'class-validator';
import { ReviewsService } from './reviews.service';
import { CurrentUser, Roles } from '../auth/auth.decorators';
import { RolesGuard } from '../auth/roles.guard';
import { Rol } from '@prisma/client';

class CreateReviewDto {
  @IsString()
  appointmentId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  texto: string;
}

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('reviews')
export class ReviewsController {
  constructor(private service: ReviewsService) {}

  @Roles(Rol.PACIENTE, Rol.ESPECIALISTA)
  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateReviewDto) {
    return this.service.create(userId, dto.appointmentId, dto.rating, dto.texto);
  }

  @Roles(Rol.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
