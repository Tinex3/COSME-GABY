import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('treatments')
export class TreatmentsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.treatment.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
  }
}
