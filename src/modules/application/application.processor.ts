import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job as BullJob } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application } from './entities/application.entity';

export const APPLICATION_QUEUE = 'application-scoring';

export interface ScoringJobData {
  applicationId: string;
  jobSkills: string[];
  candidateData: CandidateProfile;
}

export interface CandidateProfile {
  candidateId: string;
  skills?: string[];
  experienceYears?: number;
}

@Processor(APPLICATION_QUEUE)
export class ApplicationScoringProcessor extends WorkerHost {
  private readonly logger = new Logger(ApplicationScoringProcessor.name);

  constructor(
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
  ) {
    super();
  }

  async process(job: BullJob<ScoringJobData>): Promise<void> {
    const { applicationId, jobSkills, candidateData } = job.data;
    this.logger.log(`Scoring application: ${applicationId}`);

    try {
      const score = this.calculateScore(jobSkills, candidateData);

      await this.applicationRepository
        .createQueryBuilder()
        .update(Application)
        .set({
          score,
          metadata: {
            ...candidateData,
            scoredAt: new Date().toISOString(),
            scoringVersion: '1.0',
          },
        })
        .where('id = :id', { id: applicationId })
        .execute();

      this.logger.log(`Application ${applicationId} scored: ${score}`);
    } catch (error) {
      this.logger.error(`Scoring failed: ${applicationId}`, error);
      throw error;
    }
  }

  private calculateScore(
    jobSkills: string[],
    candidateData: CandidateProfile,
  ): number {
    const candidateSkills: string[] = candidateData.skills ?? [];
    if (jobSkills.length === 0) return 50;

    const matchCount = jobSkills.filter((skill) =>
      candidateSkills.some((cs) => cs.toLowerCase() === skill.toLowerCase()),
    ).length;

    const baseScore = (matchCount / jobSkills.length) * 100;
    const expBonus = Math.min((candidateData.experienceYears ?? 0) * 2, 20);
    return Math.min(Math.round(baseScore + expBonus), 100);
  }
}
