import {
  Repository,
  DeepPartial,
  FindOptionsWhere,
  FindOptionsOrder,
  ObjectLiteral,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { PaginationDto } from '../dto/pagination.dto';
import { IPaginationMeta } from '../interfaces/response.interface';

export interface IPaginatedResult<T> {
  data: T[];
  meta: IPaginationMeta;
}

export class BaseRepository<T extends BaseEntity & ObjectLiteral> {
  constructor(protected readonly repository: Repository<T>) {}

  async findAllPaginated(
    pagination: PaginationDto,
    where?: FindOptionsWhere<T>,
  ): Promise<IPaginatedResult<T>> {
    const { page, limit, sortBy, sortOrder, skip } = pagination;

    const order: FindOptionsOrder<T> = {
      [sortBy]: sortOrder,
    } as FindOptionsOrder<T>;

    const [data, totalItems] = await this.repository.findAndCount({
      where,
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

  async findById(id: string): Promise<T | null> {
    const where = { id } as FindOptionsWhere<T>;
    return this.repository.findOne({ where });
  }

  async createEntity(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async updateEntity(id: string, data: DeepPartial<T>): Promise<T | null> {
    const partialEntity = data as Record<string, unknown>;
    await this.repository.update(
      id,
      partialEntity as Parameters<typeof this.repository.update>[1],
    );
    return this.findById(id);
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.repository.softDelete(id);
    return (result.affected ?? 0) > 0;
  }

  async hardDelete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
