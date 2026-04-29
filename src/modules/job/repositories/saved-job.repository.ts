import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedJob } from '../entities/saved-job.entity';
import { BaseRepository } from '../../../common/base/base.repository';

@Injectable()
export class SavedJobRepository extends BaseRepository<SavedJob> {
  constructor(
    @InjectRepository(SavedJob)
    repository: Repository<SavedJob>,
  ) {
    super(repository);
  }

  async findByCandidateAndJob(
    candidateId: string,
    jobId: string,
  ): Promise<SavedJob | null> {
    return this.repository.findOne({ where: { candidateId, jobId } });
  }

  async deleteByCandidateAndJob(
    candidateId: string,
    jobId: string,
  ): Promise<void> {
    await this.repository.delete({ candidateId, jobId });
  }
}
