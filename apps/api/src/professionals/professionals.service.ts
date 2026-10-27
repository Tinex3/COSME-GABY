import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfessionalsService {
  constructor(private prisma: PrismaService) {}

  list(params: { q?: string; especialidad?: string; comuna?: string }) {
    return this.prisma.professionalProfile.findMany({
      where: {
        activo: true,
        ...(params.q
          ? {
              OR: [
                { nombrePublico: { contains: params.q, mode: 'insensitive' } },
                { bio: { contains: params.q, mode: 'insensitive' } },
                { especialidades: { has: params.q } },
              ],
            }
          : {}),
        ...(params.especialidad ? { especialidades: { has: params.especialidad } } : {}),
        ...(params.comuna ? { comuna: { contains: params.comuna, mode: 'insensitive' } } : {}),
      },
      include: {
        user: { select: { nombre: true } },
        reviews: { select: { rating: true } },
        offerings: { include: { treatment: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async get(id: string) {
    const profile = await this.prisma.professionalProfile.findFirst({
      where: { id, activo: true },
      include: {
        user: { select: { nombre: true, email: true } },
        offerings: { include: { treatment: true } },
        reviews: {
          include: { patient: { select: { nombre: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        credential: { select: { estado: true, tipo: true } },
      },
    });
    if (!profile) throw new NotFoundException('Profesional no encontrado');
    return profile;
  }

  async updateOwn(userId: string, data: Partial<{
    nombrePublico: string;
    titulo: string;
    bio: string;
    especialidades: string[];
    comuna: string;
    lat: number;
    lng: number;
    activo: boolean;
  }>) {
    const profile = await this.prisma.professionalProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('No tienes perfil de especialista');
    return this.prisma.professionalProfile.update({ where: { userId }, data });
  }

  async updateOfferings(userId: string, items: { treatmentId: string; precioCustom?: number; duracionCustom?: number }[]) {
    const profile = await this.prisma.professionalProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('No tienes perfil de especialista');

    await this.prisma.serviceOffering.deleteMany({ where: { professionalId: profile.id } });
    if (items.length > 0) {
      await this.prisma.serviceOffering.createMany({
        data: items.map((i) => ({
          professionalId: profile.id,
          treatmentId: i.treatmentId,
          precioCustom: i.precioCustom ?? null,
          duracionCustom: i.duracionCustom ?? null,
        })),
      });
    }
    return this.prisma.serviceOffering.findMany({
      where: { professionalId: profile.id },
      include: { treatment: true },
    });
  }

  async submitCredential(userId: string, numeroRegistro: string, archivoUrl?: string) {
    const profile = await this.prisma.professionalProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('No tienes perfil de especialista');
    return this.prisma.credential.upsert({
      where: { professionalId: profile.id },
      create: { professionalId: profile.id, numeroRegistro, archivoUrl },
      update: { numeroRegistro, archivoUrl, estado: 'PENDIENTE' },
    });
  }
}
