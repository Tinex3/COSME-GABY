import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(patientId: string, appointmentId: string, rating: number, texto: string) {
    if (rating < 1 || rating > 5) throw new BadRequestException('El rating debe ser entre 1 y 5');

    const appt = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { review: true },
    });
    if (!appt) throw new NotFoundException('Cita no encontrada');
    if (appt.patientId !== patientId) throw new BadRequestException('Esta cita no es tuya');
    if (appt.estado !== 'COMPLETADA') {
      throw new BadRequestException('Solo puedes valorar citas completadas');
    }
    if (appt.review) throw new BadRequestException('Ya dejaste una valoración para esta cita');

    return this.prisma.review.create({
      data: {
        appointmentId,
        patientId,
        professionalId: appt.professionalId,
        rating,
        texto,
      },
    });
  }

  async remove(reviewId: string) {
    const r = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!r) throw new NotFoundException('Valoración no encontrada');
    await this.prisma.review.delete({ where: { id: reviewId } });
    return { ok: true };
  }
}
