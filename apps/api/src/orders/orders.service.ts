import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { OrderEstado, Rol } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const TRANSITIONS: Record<string, OrderEstado[]> = {
  PENDIENTE: ['EN_ATENCION', 'CANCELADA'],
  EN_ATENCION: ['COMPLETADA', 'CANCELADA'],
  COMPLETADA: [],
  CANCELADA: [],
};

const include = {
  appointment: {
    include: {
      treatment: true,
      patient: { select: { id: true, nombre: true, email: true } },
      professional: { include: { user: { select: { nombre: true } } } },
    },
  },
  events: {
    include: { actor: { select: { nombre: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async createForAppointment(appointmentId: string) {
    const year = new Date().getFullYear();
    const count = await this.prisma.serviceOrder.count();
    const folio = `ORD-${year}-${String(count + 1).padStart(4, '0')}`;
    const order = await this.prisma.serviceOrder.create({
      data: {
        folio,
        appointmentId,
        estado: 'PENDIENTE',
        events: { create: { estado: 'PENDIENTE', comentario: 'Orden creada al agendar' } },
      },
    });
    return order;
  }

  async syncAppointmentState(appointmentId: string, apptState: string, comment: string, actorId?: string) {
    const order = await this.prisma.serviceOrder.findUnique({ where: { appointmentId } });
    if (!order) return null;
    if (order.estado === 'CANCELADA' || order.estado === 'COMPLETADA') return order;

    const nuevoEstado: OrderEstado =
      apptState === 'CANCELADA' || apptState === 'NO_PRESENTADO'
        ? 'CANCELADA'
        : apptState === 'COMPLETADA'
          ? 'COMPLETADA'
          : order.estado;

    return this.prisma.serviceOrder.update({
      where: { id: order.id },
      data: {
        estado: nuevoEstado,
        events: { create: { estado: nuevoEstado, comentario: comment, actorId } },
      },
    });
  }

  async listMine(user: { id: string; roles: Rol[] }) {
    const isSpecialist = user.roles.includes(Rol.ESPECIALISTA);
    const [asPatient, asSpecialist] = await Promise.all([
      this.prisma.serviceOrder.findMany({
        where: { appointment: { patientId: user.id } },
        include,
        orderBy: { createdAt: 'desc' },
      }),
      isSpecialist
        ? this.prisma.serviceOrder.findMany({
            where: { appointment: { professional: { userId: user.id } } },
            include,
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),
    ]);
    return [
      ...asPatient.map((o) => ({ ...o, vista: 'PACIENTE' as const })),
      ...asSpecialist.map((o) => ({ ...o, vista: 'ESPECIALISTA' as const })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async listAll() {
    return this.prisma.serviceOrder.findMany({ include, orderBy: { createdAt: 'desc' } });
  }

  async transition(user: { id: string; roles: Rol[] }, orderId: string, estado: OrderEstado, comentario: string) {
    const order = await this.prisma.serviceOrder.findUnique({
      where: { id: orderId },
      include: { appointment: { include: { professional: true } } },
    });
    if (!order) throw new NotFoundException('Orden no encontrada');

    const isAdmin = user.roles.includes(Rol.ADMIN);
    const isSpecialist = order.appointment.professional.userId === user.id;
    if (!isSpecialist && !isAdmin) {
      throw new ForbiddenException('Solo el especialista o un admin pueden actualizar la orden');
    }

    const allowed = TRANSITIONS[order.estado] || [];
    if (!allowed.includes(estado)) {
      throw new BadRequestException(`Transición inválida: ${order.estado} → ${estado}`);
    }

    return this.prisma.serviceOrder.update({
      where: { id: order.id },
      data: {
        estado,
        ...(estado === 'COMPLETADA' && comentario ? { notas: comentario } : {}),
        events: { create: { estado, comentario, actorId: user.id } },
      },
      include,
    });
  }
}
