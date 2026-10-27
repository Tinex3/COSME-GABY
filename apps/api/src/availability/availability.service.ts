import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface Range {
  inicio: number;
  fin: number;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function toHHMM(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  private async resolveProfileId(userId?: string, professionalId?: string) {
    if (professionalId) {
      const p = await this.prisma.professionalProfile.findUnique({ where: { id: professionalId } });
      if (!p) throw new NotFoundException('Profesional no encontrado');
      return p.id;
    }
    if (!userId) throw new BadRequestException('Se requiere usuario o profesional');
    const p = await this.prisma.professionalProfile.findUnique({ where: { userId } });
    if (!p) throw new NotFoundException('No tienes perfil de especialista');
    return p.id;
  }

  async getRules(userId: string) {
    const professionalId = await this.resolveProfileId(userId);
    return this.prisma.availabilityRule.findMany({
      where: { professionalId },
      orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }],
    });
  }

  async replaceRules(userId: string, rules: { diaSemana: number; horaInicio: string; horaFin: string }[]) {
    const professionalId = await this.resolveProfileId(userId);
    for (const r of rules) {
      if (toMinutes(r.horaFin) <= toMinutes(r.horaInicio)) {
        throw new BadRequestException(`Horario inválido: ${r.horaInicio}-${r.horaFin}`);
      }
    }
    await this.prisma.availabilityRule.deleteMany({ where: { professionalId } });
    if (rules.length > 0) {
      await this.prisma.availabilityRule.createMany({
        data: rules.map((r) => ({ professionalId, ...r })),
      });
    }
    return this.prisma.availabilityRule.findMany({ where: { professionalId } });
  }

  async getExceptions(userId: string) {
    const professionalId = await this.resolveProfileId(userId);
    return this.prisma.availabilityException.findMany({
      where: { professionalId },
      orderBy: { fecha: 'asc' },
    });
  }

  async addException(userId: string, dto: { fecha: string; tipo: 'BLOQUEO' | 'HORARIO_EXTRA'; horaInicio?: string; horaFin?: string }) {
    const professionalId = await this.resolveProfileId(userId);
    return this.prisma.availabilityException.create({
      data: {
        professionalId,
        fecha: new Date(dto.fecha),
        tipo: dto.tipo,
        horaInicio: dto.horaInicio,
        horaFin: dto.horaFin,
      },
    });
  }

  async removeException(userId: string, id: string) {
    const professionalId = await this.resolveProfileId(userId);
    const { count } = await this.prisma.availabilityException.deleteMany({ where: { id, professionalId } });
    if (count === 0) throw new NotFoundException('Excepción no encontrada');
    return { ok: true };
  }

  async getFreeSlots(professionalId: string, fecha: string, duracionMin = 60) {
    const profile = await this.prisma.professionalProfile.findUnique({ where: { id: professionalId } });
    if (!profile) throw new NotFoundException('Profesional no encontrado');

    const date = new Date(`${fecha}T12:00:00`);
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Fecha inválida');
    const dow = date.getDay();

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const [rules, exceptions, appointments] = await Promise.all([
      this.prisma.availabilityRule.findMany({ where: { professionalId, diaSemana: dow } }),
      this.prisma.availabilityException.findMany({
        where: { professionalId, fecha: { gte: dayStart, lte: dayEnd } },
      }),
      this.prisma.appointment.findMany({
        where: {
          professionalId,
          startAt: { gte: dayStart, lte: dayEnd },
          estado: { in: ['CONFIRMADA', 'COMPLETADA', 'NO_PRESENTADO'] },
        },
      }),
    ]);

    let ranges: Range[] = rules.map((r) => ({
      inicio: toMinutes(r.horaInicio),
      fin: toMinutes(r.horaFin),
    }));

    for (const ex of exceptions) {
      if (ex.tipo === 'BLOQUEO') {
        if (!ex.horaInicio || !ex.horaFin) {
          ranges = [];
          break;
        }
        const bIn = toMinutes(ex.horaInicio);
        const bFin = toMinutes(ex.horaFin);
        ranges = ranges.flatMap((rg) => {
          if (!overlaps(rg.inicio, rg.fin, bIn, bFin)) return [rg];
          const parts: Range[] = [];
          if (bIn > rg.inicio) parts.push({ inicio: rg.inicio, fin: Math.min(bIn, rg.fin) });
          if (bFin < rg.fin) parts.push({ inicio: Math.max(bFin, rg.inicio), fin: rg.fin });
          return parts.filter((p) => p.fin - p.inicio >= duracionMin);
        });
      } else if (ex.tipo === 'HORARIO_EXTRA' && ex.horaInicio && ex.horaFin) {
        ranges.push({ inicio: toMinutes(ex.horaInicio), fin: toMinutes(ex.horaFin) });
      }
    }

    const busy = appointments.map((a) => ({
      inicio: a.startAt.getHours() * 60 + a.startAt.getMinutes(),
      fin: a.endAt.getHours() * 60 + a.endAt.getMinutes(),
    }));

    const now = new Date();
    const isToday = fecha === now.toISOString().slice(0, 10);
    const nowMin = now.getHours() * 60 + now.getMinutes();

    const slots: string[] = [];
    const step = 30;
    for (const rg of ranges) {
      for (let s = rg.inicio; s + duracionMin <= rg.fin; s += step) {
        const e = s + duracionMin;
        if (busy.some((b) => overlaps(s, e, b.inicio, b.fin))) continue;
        if (isToday && s <= nowMin) continue;
        slots.push(toHHMM(s));
      }
    }
    return [...new Set(slots)].sort();
  }
}
