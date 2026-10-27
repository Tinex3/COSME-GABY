import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsString, MinLength } from 'class-validator';
import { ForumsService } from './forums.service';
import { CurrentUser, Roles } from '../auth/auth.decorators';
import { RolesGuard } from '../auth/roles.guard';
import { Rol } from '@prisma/client';

class CreateTopicDto {
  @IsString()
  categoryId: string;

  @IsString()
  @MinLength(4)
  titulo: string;

  @IsString()
  @MinLength(2)
  contenido: string;
}

class ReplyDto {
  @IsString()
  @MinLength(2)
  contenido: string;
}

class CategoryDto {
  @IsString()
  nombre: string;

  @IsString()
  slug: string;

  @IsString()
  descripcion?: string;
}

@Controller('forums')
export class ForumsController {
  constructor(private service: ForumsService) {}

  @Get('categories')
  categories() {
    return this.service.categories();
  }

  @Get('topics')
  topics(@Query('category') category?: string) {
    return this.service.topics(category);
  }

  @Get('topics/:id')
  topic(@Param('id') id: string) {
    return this.service.topic(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('topics')
  createTopic(@CurrentUser() user: any, @Body() dto: CreateTopicDto) {
    return this.service.createTopic(user, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('topics/:id/replies')
  createReply(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: ReplyDto) {
    return this.service.createReply(user, id, dto.contenido);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Rol.ADMIN)
  @Post('categories')
  createCategory(@CurrentUser() user: any, @Body() dto: CategoryDto) {
    return this.service.createCategory(user, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Rol.ADMIN)
  @Delete('topics/:id')
  deleteTopic(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.deleteTopic(user, id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Rol.ADMIN)
  @Patch('topics/:id/closed')
  toggleTopic(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.toggleTopic(user, id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Rol.ADMIN)
  @Delete('replies/:id')
  deleteReply(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.deleteReply(user, id);
  }
}
