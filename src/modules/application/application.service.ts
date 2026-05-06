import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Application } from './entities/application.entity';
import { ApplicationRepository } from './application.repository';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CLOUDINARY_FOLDERS } from '../cloudinary/constants/cloudinary.constants';
import { BaseService } from '../../common/base/base.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { IPaginatedResult } from '../../common/base/base.repository';
import { APPLICATION_QUEUE } from './application.processor';
import type { ScoringJobData } from './application.processor';
import { JobService } from '../job/job.service';
import { JobStatus } from '../job/entities/job.entity';
import { FindOptionsWhere } from 'typeorm';
import { ApplicationStatus } from './enums/application-status';

/** Valid status transitions for applications */
const STATUS_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  [ApplicationStatus.PENDING]: [
    ApplicationStatus.REVIEWING,
    ApplicationStatus.REJECTED,
  ],
  [ApplicationStatus.REVIEWING]: [
    ApplicationStatus.SHORTLISTED,
    ApplicationStatus.REJECTED,
  ],
  [ApplicationStatus.SHORTLISTED]: [
    ApplicationStatus.INTERVIEW,
    ApplicationStatus.REJECTED,
  ],
  [ApplicationStatus.INTERVIEW]: [
    ApplicationStatus.OFFERED,
    ApplicationStatus.REJECTED,
  ],
  [ApplicationStatus.OFFERED]: [ApplicationStatus.REJECTED],
  [ApplicationStatus.REJECTED]: [],
  [ApplicationStatus.WITHDRAWN]: [],
};

export const APPLICATION_EVENTS = {
  STATUS_UPDATED: 'application.status.updated',
};

@Injectable()
export class ApplicationService extends BaseService<Application> {
  private readonly logger = new Logger(ApplicationService.name);

  constructor(
    private readonly applicationRepository: ApplicationRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly jobService: JobService,
    private readonly eventEmitter: EventEmitter2,
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

    // Verify job exists and is open
    const job = await this.jobService.findOne(jobId);

    if (job.status !== JobStatus.OPEN) {
      throw new BadRequestException(
        'This job is not currently open for applications',
      );
    }

    // Check if job has expired
    if (job.expiredAt && new Date(job.expiredAt) < new Date()) {
      throw new BadRequestException('This job has expired');
    }

    // Upload CV to Cloudinary if provided
    let cvUrl: string | undefined;
    let cvPublicId: string | undefined;
    if (cvFile) {
      const uploadResult = await this.cloudinaryService.uploadFile(
        cvFile,
        CLOUDINARY_FOLDERS.RESUMES,
      );
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
      jobSkills: job.jobSkills?.map((js) => js.skillId) ?? [],
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

  async updateApplicationStatus(
    applicationId: string,
    newStatus: ApplicationStatus,
  ): Promise<Application> {
    const application = await this.findOne(applicationId);

    const allowedTransitions = STATUS_TRANSITIONS[application.status];
    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from "${application.status}" to "${newStatus}"`,
      );
    }

    const updated = await this.update(applicationId, { status: newStatus });
    this.logger.log(
      `Application ${applicationId} status: ${application.status} → ${newStatus}`,
    );

    this.eventEmitter.emit(APPLICATION_EVENTS.STATUS_UPDATED, updated);

    return updated;
  }

  async withdrawApplication(
    applicationId: string,
    candidateId: string,
  ): Promise<Application> {
    const application = await this.findOne(applicationId);

    if (application.candidateId !== candidateId) {
      throw new BadRequestException(
        'You can only withdraw your own applications',
      );
    }

    if (application.status === ApplicationStatus.WITHDRAWN) {
      throw new BadRequestException('Application already withdrawn');
    }

    return this.update(applicationId, { status: ApplicationStatus.WITHDRAWN });
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
