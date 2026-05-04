import { NotFoundException } from '@nestjs/common';
import { DeepPartial, FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { BaseEntity } from './base.entity';
import { BaseRepository, IPaginatedResult } from './base.repository';
import { PaginationDto } from '../dto/pagination.dto';

export abstract class BaseService<T extends BaseEntity & ObjectLiteral> {
  constructor(protected readonly baseRepository: BaseRepository<T>) {}

  async findAll(
    pagination: PaginationDto,
    where?: FindOptionsWhere<T>,
  ): Promise<IPaginatedResult<T>> {
    return this.baseRepository.findAllPaginated(pagination, where);
  }

  async findOne(id: string): Promise<T> {
    const entity = await this.baseRepository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Entity with id "${id}" not found`);
    }
    return entity;
  }

  async create(data: DeepPartial<T>): Promise<T> {
    return this.baseRepository.createEntity(data);
  }

  async update(id: string, data: DeepPartial<T>): Promise<T> {
    await this.findOne(id);
    const updated = await this.baseRepository.updateEntity(id, data);
    if (!updated) {
      throw new NotFoundException(
        `Entity with id "${id}" not found after update`,
      );
    }
    return updated;
  }

  async softDelete(id: string): Promise<boolean> {
    await this.findOne(id);
    return this.baseRepository.softDelete(id);
  }
}
