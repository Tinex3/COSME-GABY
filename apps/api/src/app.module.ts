import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProfessionalsModule } from './professionals/professionals.module';
import { TreatmentsModule } from './treatments/treatments.module';
import { AvailabilityModule } from './availability/availability.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { ReviewsModule } from './reviews/reviews.module';
import { BlogModule } from './blog/blog.module';
import { AdminModule } from './admin/admin.module';
import { UploadsModule } from './uploads/uploads.module';
import { ForumsModule } from './forums/forums.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ProfessionalsModule,
    TreatmentsModule,
    AvailabilityModule,
    AppointmentsModule,
    ReviewsModule,
    BlogModule,
    AdminModule,
    UploadsModule,
    ForumsModule,
    OrdersModule,
  ],
})
export class AppModule {}
