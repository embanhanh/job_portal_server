import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Experience } from '../entities/experience.entity';
import { BaseRepository } from '../../../common/base/base.repository';

@Injectable()
export class ExperienceRepository extends BaseRepository<Experience> {
  constructor(
    @InjectRepository(Experience)
    repository: Repository<Experience>,
  ) {
    super(repository);
  }
}
