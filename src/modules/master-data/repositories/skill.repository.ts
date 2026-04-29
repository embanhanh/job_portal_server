import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Skill } from '../entities/skill.entity';
import { BaseRepository } from '../../../common/base/base.repository';

@Injectable()
export class SkillRepository extends BaseRepository<Skill> {
  constructor(
    @InjectRepository(Skill)
    repository: Repository<Skill>,
  ) {
    super(repository);
  }

  async findBySlug(slug: string): Promise<Skill | null> {
    return this.repository.findOne({ where: { slug } });
  }
}
