import { forwardRef, Module } from '@nestjs/common';
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
import { CandidateModule } from '../candidate/candidate.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Application]),
    BullModule.registerQueue({ name: APPLICATION_QUEUE }),
    forwardRef(() => JobModule),
    CandidateModule,
    CloudinaryModule,
  ],
  controllers: [ApplicationController],
  providers: [
    ApplicationService,
    ApplicationRepository,
    ApplicationScoringProcessor,
  ],
  exports: [ApplicationService, ApplicationRepository],
})
export class ApplicationModule {}
