import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { ClsServiceManager } from 'nestjs-cls';
import { Job } from './entities/job.entity';
import { JobTranslation } from './entities/job-translation.entity';
import { TranslatableRepository } from '../../common/base/translatable.repository';
import { IPaginatedResult } from '../../common/base/base.repository';
import { JobFilterDto } from './dto/job-filter.dto';

@Injectable()
export class JobRepository extends TranslatableRepository<Job, JobTranslation> {
  constructor(
    @InjectRepository(Job)
    repository: Repository<Job>,
  ) {
    super(repository, JobTranslation, 'jobId', [
      'title',
      'description',
      'requirements',
      'benefits',
    ]);
  }

  async findAllWithSearch(
    filter: JobFilterDto,
    where?: FindOptionsWhere<Job>,
  ): Promise<IPaginatedResult<Job>> {
    const {
      page,
      limit,
      sortBy,
      sortOrder,
      skip,
      search,
      categoryId,
      locationId,
      type,
      status,
      salaryMin,
      salaryMax,
      companyId,
    } = filter;

    const cls = ClsServiceManager.getClsService();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const lang = cls.get('lang') || 'en';

    const queryBuilder = this.repository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.employer', 'employer')
      .leftJoinAndSelect('job.company', 'company')
      .leftJoinAndSelect('job.category', 'category')
      .leftJoinAndSelect('job.location', 'location')
      .leftJoinAndSelect('job.jobSkills', 'jobSkill')
      .leftJoinAndSelect('jobSkill.skill', 'skill')
      .leftJoin(
        'job_translations',
        'trans',
        'trans.job_id = job.id AND trans.language = :lang',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        { lang },
      );

    // Apply search across translation fields
    if (search) {
      queryBuilder.andWhere(
        `(trans.title ILIKE :search OR trans.description ILIKE :search)`,
        { search: `%${search}%` },
      );
    }

    // Apply additional where conditions
    if (where) {
      Object.entries(where).forEach(([key, value]) => {
        if (value !== undefined) {
          queryBuilder.andWhere(`job.${key} = :${key}`, { [key]: value });
        }
      });
    }

    // Apply filters from DTO
    if (categoryId) {
      queryBuilder.andWhere('job.categoryId = :categoryId', { categoryId });
    }
    if (locationId) {
      queryBuilder.andWhere('job.locationId = :locationId', { locationId });
    }
    if (type) {
      queryBuilder.andWhere('job.type = :type', { type });
    }
    if (status) {
      queryBuilder.andWhere('job.status = :status', { status });
    }
    if (companyId) {
      queryBuilder.andWhere('job.companyId = :companyId', { companyId });
    }
    if (salaryMin !== undefined) {
      queryBuilder.andWhere('job.salaryMax >= :salaryMin', { salaryMin });
    }
    if (salaryMax !== undefined) {
      queryBuilder.andWhere('job.salaryMin <= :salaryMax', { salaryMax });
    }

    queryBuilder.orderBy(`job.${sortBy}`, sortOrder).skip(skip).take(limit);

    const [data, totalItems] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(totalItems / limit);

    const translatedData = await this.applyTranslationsMany(data);

    return {
      data: translatedData,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findByIdWithRelations(id: string): Promise<Job | null> {
    const job = await this.repository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.employer', 'employer')
      .leftJoinAndSelect('job.company', 'company')
      .leftJoinAndSelect('job.category', 'category')
      .leftJoinAndSelect('job.location', 'location')
      .leftJoinAndSelect('job.jobSkills', 'jobSkill')
      .leftJoinAndSelect('jobSkill.skill', 'skill')
      .where('job.id = :id', { id })
      .getOne();

    if (!job) return null;
    return this.applyTranslations(job);
  }
}
