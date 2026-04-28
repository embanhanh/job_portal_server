import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DeepPartial } from 'typeorm';
import { Job, JobStatus } from './entities/job.entity';
import { JobRepository } from './job.repository';
import { BaseService } from '../../common/base/base.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { IPaginatedResult } from '../../common/base/base.repository';

export const JOB_EVENTS = {
  CREATED: 'job.created',
  UPDATED: 'job.updated',
  DELETED: 'job.deleted',
  PUBLISHED: 'job.published',
} as const;

const TRANSLATABLE_FIELDS: (keyof Job)[] = [
  'title',
  'description',
  'requirements',
  'benefits',
];

@Injectable()
export class JobService extends BaseService<Job> {
  private readonly logger = new Logger(JobService.name);

  constructor(
    private readonly jobRepository: JobRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super(jobRepository);
  }

  async findAllJobs(
    pagination: PaginationDto,
    lang?: string,
  ): Promise<IPaginatedResult<Job>> {
    const result = await this.jobRepository.findAllWithSearch(pagination, {
      status: JobStatus.PUBLISHED,
    });

    if (lang) {
      result.data = this.mapLanguageMany(
        result.data,
        lang,
        TRANSLATABLE_FIELDS,
      );
    }

    return result;
  }

  async findOneJob(id: string, lang?: string): Promise<Job> {
    const job = await this.findOne(id);

    if (lang) {
      return this.mapLanguage(job, lang, TRANSLATABLE_FIELDS);
    }

    return job;
  }

  async createJob(data: DeepPartial<Job>, employerId: string): Promise<Job> {
    const job = await this.create({ ...data, employerId });

    this.logger.log(`Job created: ${job.id}`);
    this.eventEmitter.emit(JOB_EVENTS.CREATED, job);

    return job;
  }

  async updateJob(id: string, data: DeepPartial<Job>): Promise<Job> {
    const job = await this.update(id, data);

    this.logger.log(`Job updated: ${job.id}`);
    this.eventEmitter.emit(JOB_EVENTS.UPDATED, job);

    return job;
  }

  async publishJob(id: string): Promise<Job> {
    const job = await this.update(id, { status: JobStatus.PUBLISHED });

    this.logger.log(`Job published: ${job.id}`);
    this.eventEmitter.emit(JOB_EVENTS.PUBLISHED, job);

    return job;
  }

  async deleteJob(id: string): Promise<boolean> {
    const job = await this.findOne(id);
    const result = await this.softDelete(id);

    if (result) {
      this.logger.log(`Job soft-deleted: ${id}`);
      this.eventEmitter.emit(JOB_EVENTS.DELETED, job);
    }

    return result;
  }
}
