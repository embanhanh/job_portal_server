import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Candidate } from './entities/candidate.entity';
import { BaseRepository } from '../../common/base/base.repository';

@Injectable()
export class CandidateRepository extends BaseRepository<Candidate> {
  constructor(
    @InjectRepository(Candidate)
    repository: Repository<Candidate>,
  ) {
    super(repository);
  }

  async findByUserId(userId: string): Promise<Candidate | null> {
    return this.repository.findOne({
      where: { userId },
      relations: [
        'user',
        'educations',
        'experiences',
        'candidateSkills',
        'candidateSkills.skill',
      ],
    });
  }

  async findWithFilters(
    page: number,
    limit: number,
    skillIds?: string[],
  ): Promise<{ data: Candidate[]; total: number }> {
    const query = this.repository
      .createQueryBuilder('candidate')
      .leftJoinAndSelect('candidate.user', 'user')
      .leftJoinAndSelect('candidate.candidateSkills', 'cs')
      .leftJoinAndSelect('cs.skill', 'skill')
      .where('candidate.isSearching = :isSearching', { isSearching: true });

    if (skillIds && skillIds.length > 0) {
      query.andWhere('cs.skill_id IN (:...skillIds)', { skillIds });
    }

    query.skip((page - 1) * limit).take(limit);

    const [data, total] = await query.getManyAndCount();
    return { data, total };
  }
}
