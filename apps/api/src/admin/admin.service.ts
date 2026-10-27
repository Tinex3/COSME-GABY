import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { VerificacionEstado } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async metrics() {
    const [users, specialists, verified, appointments, completed, reviews, pendingCredentials] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.professionalProfile.count(),
        this.prisma.professionalProfile.count({ where: { verificado: true } }),
        this.prisma.appointment.count(),
        this.prisma.appointment.count({ where: { estado: 'COMPLETADA' } }),
        this.prisma.review.count(),
        this.prisma.credential.count({ where: { estado: 'PENDIENTE' } }),
      ]);
    return { users, specialists, verified, appointments, completed, reviews, pendingCredentials };
  }

  async kpis() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const desde14 = new Date(hoy);
    desde14.setDate(hoy.getDate() - 13);

    const dowLunes = (hoy.getDay() + 6) % 7;
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - dowLunes);
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);

    const [
      users, specialists, verified, appointments, completed, cancelled, reviews,
      pendingCredentials, orders, usersNew30, apptsLast14, reviewsAgg, ordersByState,
      topSpecialists, proximas, rules, exceptions, profiles,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.professionalProfile.count(),
      this.prisma.professionalProfile.count({ where: { verificado: true } }),
      this.prisma.appointment.count(),
      this.prisma.appointment.count({ where: { estado: 'COMPLETADA' } }),
      this.prisma.appointment.count({ where: { estado: 'CANCELADA' } }),
      this.prisma.review.count(),
      this.prisma.credential.count({ where: { estado: 'PENDIENTE' } }),
      this.prisma.serviceOrder.count(),
      this.prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 30 * 864e5) } } }),
      this.prisma.appointment.findMany({
        where: { startAt: { gte: desde14 } },
        select: { startAt: true, endAt: true, estado: true, professionalId: true },
      }),
      this.prisma.review.aggregate({ _avg: { rating: true }, _count: true }),
      this.prisma.serviceOrder.groupBy({ by: ['estado'], _count: true }),
      this.prisma.professionalProfile.findMany({
        take: 5,
        include: {
          user: { select: { nombre: true } },
          reviews: { select: { rating: true } },
          _count: { select: { appointments: true } },
        },
      }),
      this.prisma.appointment.count({
        where: { estado: 'CONFIRMADA', startAt: { gte: new Date() } },
      }),
      this.prisma.availabilityRule.findMany(),
      this.prisma.availabilityException.findMany(),
      this.prisma.professionalProfile.findMany({
        select: { id: true, nombrePublico: true },
      }),
    ]);

    const toMin = (h: string) => {
      const [a, b] = h.split(':').map(Number);
      return a * 60 + b;
    };
    const dayKey = (d: Date) => d.toISOString().slice(0, 10);

    const dayAvailable = (key: string, profId: string | null): number => {
      const noon = new Date(`${key}T12:00:00`);
      const dow = Number.isNaN(noon.getTime()) ? 0 : noon.getDay();
      let ranges = rules
        .filter((r) => r.diaSemana === dow && (!profId || r.professionalId === profId))
        .map((r) => [toMin(r.horaInicio), toMin(r.horaFin)] as [number, number]);
      const exs = exceptions.filter(
        (e) => dayKey(e.fecha) === key && (!profId || e.professionalId === profId),
      );
      for (const ex of exs) {
        if (ex.tipo === 'BLOQUEO') {
          if (!ex.horaInicio || !ex.horaFin) {
            ranges = [];
            break;
          }
          const bIn = toMin(ex.horaInicio);
          const bFin = toMin(ex.horaFin);
          ranges = ranges.flatMap(([s, f]) => {
            if (f <= bIn || s >= bFin) return [[s, f] as [number, number]];
            const parts: [number, number][] = [];
            if (s < bIn) parts.push([s, Math.min(bIn, f)]);
            if (f > bFin) parts.push([Math.max(bFin, s), f]);
            return parts;
          });
        } else if (ex.horaInicio && ex.horaFin) {
          ranges.push([toMin(ex.horaInicio), toMin(ex.horaFin)]);
        }
      }
      return ranges.reduce((s, [a, b]) => s + Math.max(0, b - a), 0);
    };

    const busyEstados = ['CONFIRMADA', 'COMPLETADA', 'NO_PRESENTADO'];
    const dayBusy = (key: string, profId: string | null): number =>
      apptsLast14
        .filter(
          (a) =>
            dayKey(a.startAt) === key &&
            busyEstados.includes(a.estado) &&
            (!profId || a.professionalId === profId),
        )
        .reduce((s, a) => s + (a.endAt.getTime() - a.startAt.getTime()) / 60000, 0);

    const pctOf = (busy: number, disp: number) =>
      disp > 0 ? Math.min(100, Math.round((busy / disp) * 100)) : 0;

    const citasPorDia: { fecha: string; total: number; completadas: number; ocupacion: number }[] = [];
    let dispTotal14 = 0;
    let busyTotal14 = 0;
    for (let i = 0; i < 14; i++) {
      const d = new Date(desde14);
      d.setDate(desde14.getDate() + i);
      const key = dayKey(d);
      const delDia = apptsLast14.filter((a) => dayKey(a.startAt) === key);
      const disp = dayAvailable(key, null);
      const busy = dayBusy(key, null);
      dispTotal14 += disp;
      busyTotal14 += busy;
      citasPorDia.push({
        fecha: key.slice(5),
        total: delDia.length,
        completadas: delDia.filter((a) => a.estado === 'COMPLETADA').length,
        ocupacion: pctOf(busy, disp),
      });
    }

    const weekKeys: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(lunes);
      d.setDate(lunes.getDate() + i);
      weekKeys.push(dayKey(d));
    }
    const dispSemana = weekKeys.reduce((s, k) => s + dayAvailable(k, null), 0);
    const busySemana = weekKeys.reduce((s, k) => s + dayBusy(k, null), 0);

    const ocupacionEspecialistas = profiles
      .map((p) => {
        const disp = weekKeys.reduce((s, k) => s + dayAvailable(k, p.id), 0);
        const busy = weekKeys.reduce((s, k) => s + dayBusy(k, p.id), 0);
        const citas = apptsLast14.filter(
          (a) => weekKeys.includes(dayKey(a.startAt)) && a.professionalId === p.id && a.estado !== 'CANCELADA',
        ).length;
        return {
          nombre: p.nombrePublico,
          ocupadoMin: Math.round(busy),
          disponibleMin: disp,
          pct: pctOf(busy, disp),
          citas,
        };
      })
      .sort((a, b) => b.pct - a.pct);

    const ocupacionPromedio = citasPorDia.length
      ? Math.round(citasPorDia.reduce((s, d) => s + d.ocupacion, 0) / citasPorDia.length)
      : 0;

    return {
      resumen: {
        users,
        specialists,
        verified,
        appointments,
        completed,
        cancelled,
        pendingCredentials,
        orders,
        usersNew30,
        proximas,
        tasaCompletado: appointments ? Math.round((completed / appointments) * 100) : 0,
        promedioResenas: reviewsAgg._avg.rating ? Math.round(reviewsAgg._avg.rating * 10) / 10 : 0,
        totalResenas: reviewsAgg._count,
        ocupacionPromedio,
        ocupacionSemana: pctOf(busySemana, dispSemana),
      },
      citasPorDia,
      ocupacionEspecialistas,
      ordenesPorEstado: Object.fromEntries(ordersByState.map((o) => [o.estado, o._count])),
      topEspecialistas: topSpecialists.map((p) => ({
        nombre: p.nombrePublico,
        citas: p._count.appointments,
        resenas: p.reviews.length,
        promedio: p.reviews.length
          ? Math.round((p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length) * 10) / 10
          : 0,
      })),
    };
  }

  async createSpecialist(dto: {
    email: string;
    password: string;
    nombre: string;
    comuna?: string;
    titulo?: string;
    bio?: string;
    especialidades?: string[];
    verificado?: boolean;
  }) {
    if (!dto.email || !dto.password || !dto.nombre) {
      throw new BadRequestException('Email, contraseña y nombre son obligatorios');
    }
    if (dto.password.length < 6) {
      throw new BadRequestException('La contraseña debe tener al menos 6 caracteres');
    }
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('El email ya está registrado');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        nombre: dto.nombre,
        roles: ['PACIENTE', 'ESPECIALISTA'],
        profile: {
          create: {
            nombrePublico: dto.nombre,
            titulo: dto.titulo || 'Cosmetóloga',
            bio: dto.bio || '',
            especialidades: dto.especialidades || [],
            comuna: dto.comuna || 'Viña del Mar',
            verificado: dto.verificado ?? true,
          },
        },
      },
      include: { profile: true },
    });
    const { passwordHash: _, ...safe } = user as any;
    return safe;
  }

  listUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        nombre: true,
        roles: true,
        estado: true,
        createdAt: true,
        profile: {
          select: {
            id: true,
            nombrePublico: true,
            comuna: true,
            verificado: true,
            activo: true,
            credential: { select: { numeroRegistro: true, estado: true, archivoUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async verifyProfessional(adminId: string, profileId: string, approved: boolean) {
    const profile = await this.prisma.professionalProfile.findUnique({ where: { id: profileId } });
    if (!profile) throw new NotFoundException('Perfil no encontrado');

    const [updated] = await this.prisma.$transaction([
      this.prisma.professionalProfile.update({
        where: { id: profileId },
        data: { verificado: approved },
      }),
      this.prisma.credential.updateMany({
        where: { professionalId: profileId, estado: 'PENDIENTE' },
        data: {
          estado: approved ? ('APROBADO' as VerificacionEstado) : ('RECHAZADO' as VerificacionEstado),
          verificadoPor: adminId,
          fechaVerificacion: new Date(),
        },
      }),
    ]);
    return updated;
  }

  listCredentials() {
    return this.prisma.credential.findMany({
      include: {
        professional: {
          include: { user: { select: { nombre: true, email: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  listReviews() {
    return this.prisma.review.findMany({
      include: {
        patient: { select: { nombre: true } },
        professional: { select: { nombrePublico: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
