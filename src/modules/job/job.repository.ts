import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere } from 'typeorm';
import { Job } from './entities/job.entity';
import { BaseRepository, IPaginatedResult } from '../../common/base/base.repository';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class JobRepository extends BaseRepository<Job> {
  constructor(
    @InjectRepository(Job)
    repository: Repository<Job>,
  ) {
    super(repository);
  }

  async findAllWithSearch(
    pagination: PaginationDto,
    where?: FindOptionsWhere<Job>,
  ): Promise<IPaginatedResult<Job>> {
    const { page, limit, sortBy, sortOrder, skip, search } = pagination;

    const queryBuilder = this.repository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.employer', 'employer');

    // Apply search across JSONB fields
    if (search) {
      queryBuilder.andWhere(
        `(job.title::text ILIKE :search OR job.description::text ILIKE :search OR job.company ILIKE :search)`,
        { search: `%${search}%` },
      );
    }

    // Apply additional where conditions
    if (where) {
      Object.entries(where).forEach(([key, value]) => {
        queryBuilder.andWhere(`job.${key} = :${key}`, { [key]: value });
      });
    }

    queryBuilder
      .orderBy(`job.${sortBy}`, sortOrder)
      .skip(skip)
      .take(limit);

    const [data, totalItems] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(totalItems / limit);

    return {
      data,
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
}
