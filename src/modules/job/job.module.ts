import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from './entities/job.entity';
import { JobSkill } from './entities/job-skill.entity';
import { SavedJob } from './entities/saved-job.entity';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { JobRepository } from './job.repository';
import { SavedJobRepository } from './repositories/saved-job.repository';
import { JobElasticsearchListener } from './job-elasticsearch.listener';

@Module({
  imports: [TypeOrmModule.forFeature([Job, JobSkill, SavedJob])],
  controllers: [JobController],
  providers: [
    JobService,
    JobRepository,
    SavedJobRepository,
    JobElasticsearchListener,
  ],
  exports: [JobService],
})
export class JobModule {}
