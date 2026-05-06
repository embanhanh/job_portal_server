import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Application } from './entities/application.entity';
import { ApplicationController } from './application.controller';
import { ApplicationService } from './application.service';
import { ApplicationRepository } from './application.repository';
import {
  ApplicationScoringProcessor,
  APPLICATION_QUEUE,
} from './application.processor';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { JobModule } from '../job/job.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Application]),
    BullModule.registerQueue({ name: APPLICATION_QUEUE }),
    JobModule,
    CloudinaryModule,
  ],
  controllers: [ApplicationController],
  providers: [
    ApplicationService,
    ApplicationRepository,
    ApplicationScoringProcessor,
  ],
  exports: [ApplicationService],
})
export class ApplicationModule {}
