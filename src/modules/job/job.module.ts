import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from './entities/job.entity';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { JobRepository } from './job.repository';
import { JobElasticsearchListener } from './job-elasticsearch.listener';

@Module({
  imports: [TypeOrmModule.forFeature([Job])],
  controllers: [JobController],
  providers: [JobService, JobRepository, JobElasticsearchListener],
  exports: [JobService],
})
export class JobModule {}
