import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AppointmentEstado, Rol } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AvailabilityService } from '../availability/availability.service';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private availability: AvailabilityService,
    private orders: OrdersService,
  ) {}

  async book(patientId: string, professionalId: string, treatmentId: string, fecha: string, hora: string) {
    const treatment = await this.prisma.treatment.findUnique({ where: { id: treatmentId } });
    if (!treatment) throw new NotFoundException('Tratamiento no encontrado');

    const offering = await this.prisma.serviceOffering.findFirst({
      where: { professionalId, treatmentId },
    });
    if (!offering) throw new BadRequestException('Este profesional no ofrece ese tratamiento');

    const duracion = offering.duracionCustom ?? treatment.duracionMin;
    const freeSlots = await this.availability.getFreeSlots(professionalId, fecha, duracion);
    if (!freeSlots.includes(hora)) {
      throw new BadRequestException('Ese horario ya no está disponible');
    }

    const [hh, mm] = hora.split(':').map(Number);
    const startAt = new Date(`${fecha}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`);
    const endAt = new Date(startAt.getTime() + duracion * 60000);

    try {
      const appt = await this.prisma.appointment.create({
        data: { patientId, professionalId, treatmentId, startAt, endAt, estado: 'CONFIRMADA' },
        include: {
          treatment: true,
          professional: { include: { user: { select: { nombre: true } } } },
        },
      });
      await this.orders.createForAppointment(appt.id).catch(() => null);
      return appt;
    } catch (e: any) {
      if (e?.code === 'P2002') throw new BadRequestException('Ese horario ya fue tomado');
      throw e;
    }
  }

  async listMine(user: { id: string; roles: Rol[] }) {
    const include = {
      treatment: true,
      patient: { select: { id: true, nombre: true, email: true } },
      professional: { include: { user: { select: { nombre: true } } } },
      review: { select: { id: true } },
    } as const;

    const [asPatient, asSpecialist] = await Promise.all([
      this.prisma.appointment.findMany({
        where: { patientId: user.id },
        include,
        orderBy: { startAt: 'desc' },
      }),
      user.roles.includes(Rol.ESPECIALISTA)
        ? this.prisma.appointment.findMany({
            where: { professional: { userId: user.id } },
            include,
            orderBy: { startAt: 'desc' },
          })
        : Promise.resolve([]),
    ]);

    return [
      ...asPatient.map((a) => ({ ...a, vista: 'PACIENTE' as const })),
      ...asSpecialist.map((a) => ({ ...a, vista: 'ESPECIALISTA' as const })),
    ].sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
  }

  async transition(user: { id: string; roles: Rol[] }, appointmentId: string, action: 'cancel' | 'complete' | 'noshow') {
    const appt = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { professional: true },
    });
    if (!appt) throw new NotFoundException('Cita no encontrada');

    const isAdmin = user.roles.includes(Rol.ADMIN);
    const isPatient = appt.patientId === user.id;
    const isSpecialist = appt.professional.userId === user.id;

    if (action === 'cancel') {
      if (!isPatient && !isAdmin) throw new ForbiddenException('Solo el cliente o un admin pueden cancelar');
      if (appt.estado !== 'CONFIRMADA') throw new BadRequestException('Solo se pueden cancelar citas confirmadas');
      const updated = await this.prisma.appointment.update({ where: { id: appointmentId }, data: { estado: 'CANCELADA' } });
      await this.orders.syncAppointmentState(appointmentId, 'CANCELADA', 'Cita cancelada', user.id).catch(() => null);
      return updated;
    }

    if (!isSpecialist && !isAdmin) throw new ForbiddenException('Solo el especialista o un admin pueden actualizar el estado');
    if (appt.estado !== 'CONFIRMADA') throw new BadRequestException('La cita ya no está confirmada');
    const estado: AppointmentEstado = action === 'complete' ? 'COMPLETADA' : 'NO_PRESENTADO';
    const updated = await this.prisma.appointment.update({ where: { id: appointmentId }, data: { estado } });
    const comment = action === 'complete' ? 'Servicio completado' : 'Cliente no se presentó';
    await this.orders.syncAppointmentState(appointmentId, estado, comment, user.id).catch(() => null);
    return updated;
  }
}
