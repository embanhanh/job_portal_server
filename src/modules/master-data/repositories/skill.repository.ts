import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Skill } from '../entities/skill.entity';
import { SkillTranslation } from '../entities/skill-translation.entity';
import { TranslatableRepository } from '../../../common/base/translatable.repository';

@Injectable()
export class SkillRepository extends TranslatableRepository<
  Skill,
  SkillTranslation
> {
  constructor(
    @InjectRepository(Skill)
    repository: Repository<Skill>,
  ) {
    super(repository, SkillTranslation, 'skillId', ['name']);
  }

  async findBySlug(slug: string): Promise<Skill | null> {
    const entity = await this.repository.findOne({ where: { slug } });
    if (!entity) return null;
    return this.applyTranslations(entity);
  }
}
