import { Module } from '@nestjs/common';
import { TreatmentsController } from './treatments.controller';

@Module({
  controllers: [TreatmentsController],
})
export class TreatmentsModule {}
