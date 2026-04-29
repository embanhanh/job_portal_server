import { ConflictException, Injectable } from '@nestjs/common';
import { Skill } from '../entities/skill.entity';
import { SkillRepository } from '../repositories/skill.repository';
import { BaseService } from '../../../common/base/base.service';
import { CreateSkillDto } from '../dto/create-skill.dto';

@Injectable()
export class SkillService extends BaseService<Skill> {
  constructor(private readonly skillRepository: SkillRepository) {
    super(skillRepository);
  }

  async createSkill(dto: CreateSkillDto): Promise<Skill> {
    const existing = await this.skillRepository.findBySlug(dto.slug);
    if (existing) {
      throw new ConflictException(
        `Skill with slug "${dto.slug}" already exists`,
      );
    }
    return this.create(dto);
  }

  async updateSkill(id: string, dto: Partial<CreateSkillDto>): Promise<Skill> {
    return this.update(id, dto);
  }

  async findBySlug(slug: string): Promise<Skill | null> {
    return this.skillRepository.findBySlug(slug);
  }
}
