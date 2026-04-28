import { NotFoundException } from '@nestjs/common';
import { DeepPartial, FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { BaseEntity } from './base.entity';
import { BaseRepository, IPaginatedResult } from './base.repository';
import { PaginationDto } from '../dto/pagination.dto';
import { ITranslatableField } from '../interfaces/response.interface';

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

  /**
   * Extracts a specific language value from JSONB translatable fields.
   */
  mapLanguage<R extends object>(data: R, lang: string, fields: (keyof R)[]): R {
    const result = { ...data };
    for (const field of fields) {
      const value = result[field] as unknown;
      if (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        lang in (value as Record<string, string>)
      ) {
        (result[field] as unknown) = (value as ITranslatableField)[lang];
      }
    }
    return result;
  }

  /**
   * Maps language for an array of entities.
   */
  mapLanguageMany<R extends object>(
    items: R[],
    lang: string,
    fields: (keyof R)[],
  ): R[] {
    return items.map((item) => this.mapLanguage(item, lang, fields));
  }
}
