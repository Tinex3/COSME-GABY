import { Module } from '@nestjs/common';
import { AvailabilityController } from './availability.controller';
import { SlotsController } from './slots.controller';
import { AvailabilityService } from './availability.service';

@Module({
  controllers: [AvailabilityController, SlotsController],
  providers: [AvailabilityService],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
