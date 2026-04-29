import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job, JobStatus } from './entities/job.entity';
import { JobSkill } from './entities/job-skill.entity';
import { SavedJobRepository } from './repositories/saved-job.repository';
import { JobRepository } from './job.repository';
import { BaseService } from '../../common/base/base.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { IPaginatedResult } from '../../common/base/base.repository';
import { CreateJobDto } from './dto/create-job.dto';

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
    @InjectRepository(JobSkill)
    private readonly jobSkillRepository: Repository<JobSkill>,
    private readonly savedJobRepository: SavedJobRepository,
  ) {
    super(jobRepository);
  }

  async findAllJobs(
    pagination: PaginationDto,
    lang?: string,
  ): Promise<IPaginatedResult<Job>> {
    const result = await this.jobRepository.findAllWithSearch(pagination, {
      status: JobStatus.OPEN,
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
    const job = await this.jobRepository.findByIdWithRelations(id);
    if (!job) {
      throw new NotFoundException(`Job with id "${id}" not found`);
    }

    if (lang) {
      return this.mapLanguage(job, lang, TRANSLATABLE_FIELDS);
    }

    return job;
  }

  async createJob(
    dto: CreateJobDto,
    employerId: string,
    companyId?: string,
  ): Promise<Job> {
    const { skillIds, ...jobData } = dto;

    const job = await this.create({
      ...jobData,
      employerId,
      companyId,
      expiredAt: dto.expiredAt ? new Date(dto.expiredAt) : undefined,
    });

    // Create job skills
    if (skillIds && skillIds.length > 0) {
      const jobSkills = skillIds.map((skillId) =>
        this.jobSkillRepository.create({ jobId: job.id, skillId }),
      );
      await this.jobSkillRepository.save(jobSkills);
    }

    this.logger.log(`Job created: ${job.id}`);
    this.eventEmitter.emit(JOB_EVENTS.CREATED, job);

    return this.findOneJob(job.id);
  }

  async updateJob(id: string, data: Partial<CreateJobDto>): Promise<Job> {
    const { skillIds, ...jobData } = data;

    const job = await this.update(id, {
      ...jobData,
      expiredAt: data.expiredAt ? new Date(data.expiredAt) : undefined,
    });

    // Update job skills if provided
    if (skillIds !== undefined) {
      await this.jobSkillRepository.delete({ jobId: id });
      if (skillIds.length > 0) {
        const jobSkills = skillIds.map((skillId) =>
          this.jobSkillRepository.create({ jobId: id, skillId }),
        );
        await this.jobSkillRepository.save(jobSkills);
      }
    }

    this.logger.log(`Job updated: ${job.id}`);
    this.eventEmitter.emit(JOB_EVENTS.UPDATED, job);

    return this.findOneJob(job.id);
  }

  async approveJob(id: string): Promise<Job> {
    const job = await this.findOne(id);
    if (job.status !== JobStatus.PENDING) {
      throw new BadRequestException('Only PENDING jobs can be approved');
    }

    const updated = await this.update(id, { status: JobStatus.OPEN });

    this.logger.log(`Job approved: ${updated.id}`);
    this.eventEmitter.emit(JOB_EVENTS.PUBLISHED, updated);

    return this.findOneJob(updated.id);
  }

  async rejectJob(id: string): Promise<Job> {
    const job = await this.findOne(id);
    if (job.status !== JobStatus.PENDING) {
      throw new BadRequestException('Only PENDING jobs can be rejected');
    }

    const updated = await this.update(id, { status: JobStatus.CLOSED });
    this.logger.log(`Job rejected: ${updated.id}`);
    this.eventEmitter.emit(JOB_EVENTS.UPDATED, updated);

    return this.findOneJob(updated.id);
  }

  async closeJob(id: string): Promise<Job> {
    const job = await this.findOne(id);
    if (job.status !== JobStatus.OPEN) {
      throw new BadRequestException('Only OPEN jobs can be closed');
    }

    const updated = await this.update(id, { status: JobStatus.CLOSED });
    this.logger.log(`Job closed: ${updated.id}`);
    this.eventEmitter.emit(JOB_EVENTS.UPDATED, updated);

    return this.findOneJob(updated.id);
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

  // ── Saved Jobs ─────────────────────────────────────────────────────

  async toggleSaveJob(
    candidateId: string,
    jobId: string,
  ): Promise<{ saved: boolean }> {
    // const job = await this.findOne(jobId);

    const existing = await this.savedJobRepository.findByCandidateAndJob(
      candidateId,
      jobId,
    );

    if (existing) {
      await this.savedJobRepository.deleteByCandidateAndJob(candidateId, jobId);
      return { saved: false };
    } else {
      await this.savedJobRepository.createEntity({ candidateId, jobId });
      return { saved: true };
    }
  }
}
