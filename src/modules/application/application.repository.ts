import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindOptionsOrder } from 'typeorm';
import { Application } from './entities/application.entity';
import { BaseRepository, IPaginatedResult } from '../../common/base/base.repository';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ApplicationRepository extends BaseRepository<Application> {
  constructor(
    @InjectRepository(Application)
    repository: Repository<Application>,
  ) {
    super(repository);
  }

  async findWithRelations(
    pagination: PaginationDto,
    where?: FindOptionsWhere<Application>,
  ): Promise<IPaginatedResult<Application>> {
    const { page, limit, sortBy, sortOrder, skip } = pagination;

    const order: FindOptionsOrder<Application> = {
      [sortBy]: sortOrder,
    } as FindOptionsOrder<Application>;

    const [data, totalItems] = await this.repository.findAndCount({
      where,
      relations: ['candidate', 'job'],
      order,
      skip,
      take: limit,
    });

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

  async findByCandidateAndJob(
    candidateId: string,
    jobId: string,
  ): Promise<Application | null> {
    const where: FindOptionsWhere<Application> = {
      candidateId,
      jobId,
    } as FindOptionsWhere<Application>;
    return this.repository.findOne({ where });
  }
}
