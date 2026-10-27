import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { Roles } from '../auth/auth.decorators';
import { RolesGuard } from '../auth/roles.guard';
import { Rol } from '@prisma/client';

class UpsertPostDto {
  @IsString()
  @MinLength(4)
  titulo: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsString()
  @MinLength(10)
  resumen: string;

  @IsString()
  @MinLength(10)
  body: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsBoolean()
  publicado?: boolean;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

@Controller('blog')
export class BlogController {
  constructor(private prisma: PrismaService) {}

  @Get()
  list(@Query('preview') preview?: string) {
    return this.prisma.blogPost.findMany({
      where: preview === '1' ? {} : { publicado: true },
      select: { id: true, titulo: true, slug: true, resumen: true, coverUrl: true, publicado: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('all/admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Rol.ADMIN)
  listAll() {
    return this.prisma.blogPost.findMany({ orderBy: { createdAt: 'desc' } });
  }

  @Get(':slug')
  async get(@Param('slug') slug: string) {
    const post = await this.prisma.blogPost.findFirst({ where: { slug, publicado: true } });
    if (!post) throw new NotFoundException('Artículo no encontrado');
    return post;
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Rol.ADMIN)
  async create(@Body() dto: UpsertPostDto) {
    let slug = dto.slug ? slugify(dto.slug) : slugify(dto.titulo);
    const exists = await this.prisma.blogPost.findUnique({ where: { slug } });
    if (exists) slug = `${slug}-${Date.now().toString(36)}`;
    return this.prisma.blogPost.create({
      data: {
        titulo: dto.titulo,
        slug,
        resumen: dto.resumen,
        body: dto.body,
        coverUrl: dto.coverUrl,
        publicado: dto.publicado ?? true,
      },
    });
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Rol.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpsertPostDto) {
    const post = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Artículo no encontrado');
    return this.prisma.blogPost.update({
      where: { id },
      data: {
        titulo: dto.titulo,
        slug: dto.slug ? slugify(dto.slug) : post.slug,
        resumen: dto.resumen,
        body: dto.body,
        coverUrl: dto.coverUrl,
        publicado: dto.publicado ?? post.publicado,
      },
    });
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Rol.ADMIN)
  async remove(@Param('id') id: string) {
    const { count } = await this.prisma.blogPost.deleteMany({ where: { id } });
    if (!count) throw new NotFoundException('Artículo no encontrado');
    return { ok: true };
  }
}
