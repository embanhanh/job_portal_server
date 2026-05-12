import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Job, JobStatus } from './entities/job.entity';
import { JobSkill } from './entities/job-skill.entity';
import { SavedJobRepository } from './repositories/saved-job.repository';
import { JobRepository } from './job.repository';
import { BaseService } from '../../common/base/base.service';
import { CreateJobDto } from './dto/create-job.dto';
import { JobFilterDto } from './dto/job-filter.dto';
import { IPaginatedResult } from '../../common/base/base.repository';
import { JobElasticsearchListener } from './job-elasticsearch.listener';
import { JobSearchResult } from './interfaces/job-search.interface';
import { CompanyService } from '../company/company.service';

import { JOB_EVENTS } from './constants/job.constants';
import { ApplicationRepository } from '../application/application.repository';
import { CandidateService } from '../candidate/candidate.service';

@Injectable()
export class JobService extends BaseService<Job> {
  private readonly logger = new Logger(JobService.name);

  constructor(
    private readonly jobRepository: JobRepository,
    private readonly eventEmitter: EventEmitter2,
    @InjectRepository(JobSkill)
    private readonly jobSkillRepository: Repository<JobSkill>,
    private readonly savedJobRepository: SavedJobRepository,
    private readonly applicationRepository: ApplicationRepository,
    private readonly esListener: JobElasticsearchListener,
    private readonly companyService: CompanyService,
    private readonly candidateService: CandidateService,
  ) {
    super(jobRepository);
  }

  async findAllJobs(filter: JobFilterDto): Promise<IPaginatedResult<Job>> {
    const { search, ...filters } = filter;

    // If search keyword is provided, use Elasticsearch to get IDs first
    if (search) {
      try {
        const esResult = await this.esListener.searchJobs(
          search,
          filter.skip,
          filter.limit,
        );

        if (esResult.hits.length > 0) {
          const ids = esResult.hits
            .map((h: JobSearchResult) => h.id)
            .filter((id): id is string => !!id);
          // Query DB for full entities using IDs, preserving other filters
          return this.jobRepository.findAllWithSearch(filter, {
            id: In(ids),
            status: filters.status || JobStatus.OPEN,
          });
        }

        // If ES returned no results, return empty paginated result
        return {
          data: [],
          meta: {
            page: filter.page,
            limit: filter.limit,
            totalItems: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        };
      } catch (error) {
        this.logger.error('ES search failed, falling back to DB', error);
      }
    }

    // Fallback or default to DB search
    return this.jobRepository.findAllWithSearch(filter, {
      status: filter.status || JobStatus.OPEN,
    });
  }

  async findOneJob(id: string): Promise<Job> {
    const job = await this.jobRepository.findByIdWithRelations(id);
    if (!job) {
      throw new NotFoundException(`Job with id "${id}" not found`);
    }
    return job;
  }

  async createJob(dto: CreateJobDto, employerId: string): Promise<Job> {
    const { skillIds, ...jobData } = dto;

    const company = await this.companyService.findByUserId(employerId);
    if (!company) {
      throw new BadRequestException(
        'Employer must have a registered company profile to post jobs',
      );
    }

    const job = await this.create({
      ...jobData,
      employerId,
      companyId: company.id,
      status: JobStatus.OPEN,
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
    userId: string,
    jobId: string,
  ): Promise<{ saved: boolean }> {
    const candidate = await this.candidateService.findByUserId(userId);
    if (!candidate) {
      throw new BadRequestException('Candidate profile not found');
    }

    const existing = await this.savedJobRepository.findByCandidateAndJob(
      candidate.id,
      jobId,
    );

    if (existing) {
      await this.savedJobRepository.deleteByCandidateAndJob(
        candidate.id,
        jobId,
      );
      return { saved: false };
    } else {
      await this.savedJobRepository.createEntity({
        candidateId: candidate.id,
        jobId,
      });
      return { saved: true };
    }
  }

  async getUserJobStatus(
    userId: string,
    jobId: string,
  ): Promise<{ isSaved: boolean; isApplied: boolean }> {
    const candidate = await this.candidateService.findByUserId(userId);

    // If no candidate profile, it's not saved and not applied (likely not a candidate role, or profile not created)
    if (!candidate) {
      return { isSaved: false, isApplied: false };
    }

    const [saved, applied] = await Promise.all([
      this.savedJobRepository.findByCandidateAndJob(candidate.id, jobId),
      this.applicationRepository.findByCandidateAndJob(userId, jobId),
    ]);

    return {
      isSaved: !!saved,
      isApplied: !!applied,
    };
  }
}
