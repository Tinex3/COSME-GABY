import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Rol } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ForumsService {
  constructor(private prisma: PrismaService) {}

  categories() {
    return this.prisma.forumCategory.findMany({
      orderBy: { orden: 'asc' },
      include: { _count: { select: { topics: true } } },
    });
  }

  topics(categorySlug?: string) {
    return this.prisma.forumTopic.findMany({
      where: categorySlug ? { category: { slug: categorySlug } } : {},
      include: {
        category: { select: { nombre: true, slug: true } },
        author: { select: { nombre: true } },
        _count: { select: { replies: true } },
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async topic(id: string) {
    const topic = await this.prisma.forumTopic.findUnique({
      where: { id },
      include: {
        category: { select: { nombre: true, slug: true } },
        author: { select: { nombre: true } },
        replies: {
          include: { author: { select: { nombre: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!topic) throw new NotFoundException('Tema no encontrado');
    return topic;
  }

  async createTopic(user: { id: string }, dto: { categoryId: string; titulo: string; contenido: string }) {
    if (!dto.titulo.trim() || !dto.contenido.trim()) {
      throw new BadRequestException('Título y contenido son obligatorios');
    }
    const cat = await this.prisma.forumCategory.findUnique({ where: { id: dto.categoryId } });
    if (!cat) throw new NotFoundException('Categoría no encontrada');
    return this.prisma.forumTopic.create({
      data: { categoryId: dto.categoryId, authorId: user.id, titulo: dto.titulo.trim(), contenido: dto.contenido.trim() },
    });
  }

  async createReply(user: { id: string }, topicId: string, contenido: string) {
    if (!contenido.trim()) throw new BadRequestException('El comentario no puede estar vacío');
    const topic = await this.prisma.forumTopic.findUnique({ where: { id: topicId } });
    if (!topic) throw new NotFoundException('Tema no encontrado');
    if (topic.cerrado) throw new BadRequestException('El tema está cerrado');
    return this.prisma.forumReply.create({
      data: { topicId, authorId: user.id, contenido: contenido.trim() },
      include: { author: { select: { nombre: true } } },
    });
  }

  private async assertAdmin(user: { id: string; roles: Rol[] }) {
    if (!user.roles.includes(Rol.ADMIN)) throw new ForbiddenException('Solo administradores');
  }

  async createCategory(user: { id: string; roles: Rol[] }, dto: { nombre: string; slug: string; descripcion?: string }) {
    await this.assertAdmin(user);
    return this.prisma.forumCategory.create({
      data: { nombre: dto.nombre, slug: dto.slug, descripcion: dto.descripcion || '' },
    });
  }

  async deleteTopic(user: { id: string; roles: Rol[] }, id: string) {
    await this.assertAdmin(user);
    const { count } = await this.prisma.forumTopic.deleteMany({ where: { id } });
    if (!count) throw new NotFoundException('Tema no encontrado');
    return { ok: true };
  }

  async toggleTopic(user: { id: string; roles: Rol[] }, id: string) {
    await this.assertAdmin(user);
    const topic = await this.prisma.forumTopic.findUnique({ where: { id } });
    if (!topic) throw new NotFoundException('Tema no encontrado');
    return this.prisma.forumTopic.update({ where: { id }, data: { cerrado: !topic.cerrado } });
  }

  async deleteReply(user: { id: string; roles: Rol[] }, id: string) {
    await this.assertAdmin(user);
    const { count } = await this.prisma.forumReply.deleteMany({ where: { id } });
    if (!count) throw new NotFoundException('Respuesta no encontrada');
    return { ok: true };
  }
}
