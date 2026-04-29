import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Education } from '../entities/education.entity';
import { BaseRepository } from '../../../common/base/base.repository';

@Injectable()
export class EducationRepository extends BaseRepository<Education> {
  constructor(
    @InjectRepository(Education)
    repository: Repository<Education>,
  ) {
    super(repository);
  }
}
