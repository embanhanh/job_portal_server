import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './entities/company.entity';
import { BaseRepository } from '../../common/base/base.repository';

@Injectable()
export class CompanyRepository extends BaseRepository<Company> {
  constructor(
    @InjectRepository(Company)
    repository: Repository<Company>,
  ) {
    super(repository);
  }

  async findByUserId(userId: string): Promise<Company | null> {
    return this.repository.findOne({
      where: { userId },
      relations: ['user'],
    });
  }
}
