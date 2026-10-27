import { Controller, Get, Query } from '@nestjs/common';
import { AvailabilityService } from './availability.service';

@Controller('slots')
export class SlotsController {
  constructor(private service: AvailabilityService) {}

  @Get()
  getSlots(
    @Query('professionalId') professionalId: string,
    @Query('fecha') fecha: string,
    @Query('duracionMin') duracionMin?: string,
  ) {
    const dur = duracionMin ? Number(duracionMin) : 60;
    return this.service.getFreeSlots(professionalId, fecha, Number.isFinite(dur) && dur > 0 ? dur : 60);
  }
}
