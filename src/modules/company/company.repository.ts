import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './entities/company.entity';
import { CompanyTranslation } from './entities/company-translation.entity';
import { TranslatableRepository } from '../../common/base/translatable.repository';

@Injectable()
export class CompanyRepository extends TranslatableRepository<
  Company,
  CompanyTranslation
> {
  constructor(
    @InjectRepository(Company)
    repository: Repository<Company>,
  ) {
    super(repository, CompanyTranslation, 'companyId', ['description']);
  }

  async findByUserId(userId: string): Promise<Company | null> {
    const entity = await this.repository.findOne({
      where: { userId },
      relations: ['user'],
    });
    if (!entity) return null;
    return this.applyTranslations(entity);
  }
}
