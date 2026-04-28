import {
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Application } from './entities/application.entity';
import { ApplicationRepository } from './application.repository';
import { CloudinaryService } from './cloudinary.service';
import { BaseService } from '../../common/base/base.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { IPaginatedResult } from '../../common/base/base.repository';
import { APPLICATION_QUEUE } from './application.processor';
import type { ScoringJobData } from './application.processor';
import { JobService } from '../job/job.service';
import { FindOptionsWhere } from 'typeorm';

@Injectable()
export class ApplicationService extends BaseService<Application> {
  private readonly logger = new Logger(ApplicationService.name);

  constructor(
    private readonly applicationRepository: ApplicationRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly jobService: JobService,
    @InjectQueue(APPLICATION_QUEUE) private readonly scoringQueue: Queue,
  ) {
    super(applicationRepository);
  }

  async apply(
    candidateId: string,
    jobId: string,
    coverLetter?: string,
    cvFile?: Express.Multer.File,
  ): Promise<Application> {
    // Check for duplicate application
    const existing = await this.applicationRepository.findByCandidateAndJob(
      candidateId,
      jobId,
    );
    if (existing) {
      throw new ConflictException('You have already applied for this job');
    }

    // Verify job exists
    const job = await this.jobService.findOne(jobId);

    // Upload CV to Cloudinary if provided
    let cvUrl: string | undefined;
    let cvPublicId: string | undefined;
    if (cvFile) {
      const uploadResult = await this.cloudinaryService.uploadFile(cvFile);
      cvUrl = uploadResult.url;
      cvPublicId = uploadResult.publicId;
    }

    // Create application
    const application = await this.create({
      candidateId,
      jobId,
      coverLetter,
      cvUrl,
      cvPublicId,
    });

    // Dispatch scoring job to BullMQ
    const scoringData: ScoringJobData = {
      applicationId: application.id,
      jobSkills: job.skills ?? [],
      candidateData: { candidateId },
    };

    await this.scoringQueue.add('score-application', scoringData, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
      removeOnFail: false,
    });

    this.logger.log(`Application ${application.id} created. Scoring queued.`);

    return application;
  }

  async findByCandidate(
    candidateId: string,
    pagination: PaginationDto,
  ): Promise<IPaginatedResult<Application>> {
    const where = { candidateId } as FindOptionsWhere<Application>;
    return this.applicationRepository.findWithRelations(pagination, where);
  }

  async findByJob(
    jobId: string,
    pagination: PaginationDto,
  ): Promise<IPaginatedResult<Application>> {
    const where = { jobId } as FindOptionsWhere<Application>;
    return this.applicationRepository.findWithRelations(pagination, where);
  }
}
