import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CandidateSkill } from '../entities/candidate-skill.entity';
import { BaseRepository } from '../../../common/base/base.repository';

@Injectable()
export class CandidateSkillRepository extends BaseRepository<CandidateSkill> {
  constructor(
    @InjectRepository(CandidateSkill)
    repository: Repository<CandidateSkill>,
  ) {
    super(repository);
  }

  async deleteByCandidateId(candidateId: string): Promise<void> {
    await this.repository.delete({ candidateId });
  }
}
