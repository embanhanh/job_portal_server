import {
  Repository,
  DeepPartial,
  ObjectType,
  ObjectLiteral,
  In,
  FindOptionsWhere,
} from 'typeorm';
import { BaseRepository, IPaginatedResult } from './base.repository';
import { BaseEntity } from './base.entity';
import { ClsServiceManager } from 'nestjs-cls';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PaginationDto } from '../dto/pagination.dto';

export abstract class TranslatableRepository<
  T extends BaseEntity & ObjectLiteral,
  U extends BaseEntity & ObjectLiteral,
> extends BaseRepository<T> {
  @Inject(CACHE_MANAGER)
  protected readonly cacheManager!: Cache;

  constructor(
    repository: Repository<T>,
    private readonly translationEntity: ObjectType<U>,
    private readonly foreignKey: keyof U,
    private readonly translatableFields: (keyof T)[],
  ) {
    super(repository);
  }

  // --- Read Overrides ---
  async findById(id: string): Promise<T | null> {
    const entity = await super.findById(id);
    if (!entity) return null;
    return this.applyTranslations(entity);
  }

  async findAllPaginated(
    pagination: PaginationDto,
    where?: FindOptionsWhere<T>,
  ): Promise<IPaginatedResult<T>> {
    const result = await super.findAllPaginated(pagination, where);
    result.data = await this.applyTranslationsMany(result.data);
    return result;
  }

  // --- Write Overrides ---
  async createEntity(data: DeepPartial<T>): Promise<T> {
    const entity = await super.createEntity(data);
    await this.syncTranslations(entity.id, data);
    return entity;
  }

  async updateEntity(id: string, data: DeepPartial<T>): Promise<T | null> {
    const updated = await super.updateEntity(id, data);
    if (updated) {
      await this.syncTranslations(id, data);
    }
    return updated;
  }

  private async syncTranslations(id: string, data: DeepPartial<T>) {
    const transRepo = this.repository.manager.getRepository(
      this.translationEntity,
    );

    // Group translation data by language
    const langData: Record<string, Partial<U>> = {};

    for (const field of this.translatableFields) {
      const fieldData = (data as Record<string, unknown>)[
        field as string
      ] as Record<string, string>;
      if (
        fieldData &&
        typeof fieldData === 'object' &&
        !Array.isArray(fieldData)
      ) {
        for (const [lang, value] of Object.entries(fieldData)) {
          if (!langData[lang]) langData[lang] = {};
          (langData[lang] as Record<string, unknown>)[field as string] = value;
        }
      }
    }

    if (Object.keys(langData).length === 0) return;

    // Upsert translation rows
    for (const [lang, values] of Object.entries(langData)) {
      const whereCond = {
        [this.foreignKey]: id,
        language: lang,
      } as unknown as FindOptionsWhere<U>;
      const existing = await transRepo.findOne({ where: whereCond });

      if (existing) {
        await transRepo.update(existing.id, values);
      } else {
        const newEntity = transRepo.create({
          ...whereCond,
          ...values,
        } as unknown as DeepPartial<U>);
        await transRepo.save(newEntity);
      }

      // Invalidate cache for this language
      const cacheKey = `${this.repository.metadata.tableName}:${id}:${lang}`;
      if (this.cacheManager) {
        await this.cacheManager.del(cacheKey);
      }
    }
  }

  async applyTranslations(entity: T): Promise<T> {
    if (!entity) return entity;

    const cls = ClsServiceManager.getClsService();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const lang = cls.get('lang') || 'en';
    const cacheKey = `${this.repository.metadata.tableName}:${entity.id}:${lang}`;

    // Check cache first
    if (this.cacheManager) {
      const cached = await this.cacheManager.get<Partial<U>>(cacheKey);
      if (cached) {
        return this.mapFields(entity, cached);
      }
    }

    // Fallback to DB
    const transRepo = this.repository.manager.getRepository(
      this.translationEntity,
    );
    const whereCond = {
      [this.foreignKey]: entity.id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      language: lang,
    } as unknown as FindOptionsWhere<U>;

    const translation = await transRepo.findOne({
      where: whereCond,
    });
    if (translation) {
      if (this.cacheManager) {
        await this.cacheManager.set(cacheKey, translation);
      }
      return this.mapFields(entity, translation);
    }

    // If no translation found for requested lang, fallback to default 'en'
    if (lang !== 'en') {
      const fallbackCond = {
        [this.foreignKey]: entity.id,
        language: 'en',
      } as unknown as FindOptionsWhere<U>;

      const defaultTrans = await transRepo.findOne({
        where: fallbackCond,
      });
      if (defaultTrans) {
        if (this.cacheManager) {
          await this.cacheManager.set(cacheKey, defaultTrans);
        }
        return this.mapFields(entity, defaultTrans);
      }
    }

    return entity;
  }

  async applyTranslationsMany(entities: T[]): Promise<T[]> {
    if (!entities || entities.length === 0) return entities;

    const cls = ClsServiceManager.getClsService();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const lang = cls.get('lang') || 'en';
    const tableName = this.repository.metadata.tableName;

    // Check cache first for all IDs
    const translations: Record<string, Partial<U>> = {};
    const missingIds: string[] = [];

    for (const entity of entities) {
      const cacheKey = `${tableName}:${entity.id}:${lang}`;
      const cached = this.cacheManager
        ? await this.cacheManager.get<Partial<U>>(cacheKey)
        : null;
      if (cached) {
        translations[entity.id] = cached;
      } else {
        missingIds.push(entity.id);
      }
    }

    if (missingIds.length > 0) {
      const transRepo = this.repository.manager.getRepository(
        this.translationEntity,
      );

      // Fetch missing from DB
      const dbTranslations = await transRepo.find({
        where: {
          [this.foreignKey]: In(missingIds),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          language: lang,
        } as unknown as FindOptionsWhere<U>,
      });

      for (const t of dbTranslations) {
        const entityId = (t as unknown as Record<string, unknown>)[
          this.foreignKey as string
        ] as string;
        translations[entityId] = t;
        const cacheKey = `${tableName}:${entityId}:${lang}`;
        if (this.cacheManager) await this.cacheManager.set(cacheKey, t);
      }

      // Check for fallbacks for missing ones if not 'en'
      if (lang !== 'en') {
        const stillMissingIds = missingIds.filter((id) => !translations[id]);
        if (stillMissingIds.length > 0) {
          const fallbackTranslations = await transRepo.find({
            where: {
              [this.foreignKey]: In(stillMissingIds),
              language: 'en',
            } as unknown as FindOptionsWhere<U>,
          });

          for (const t of fallbackTranslations) {
            const entityId = (t as unknown as Record<string, unknown>)[
              this.foreignKey as string
            ] as string;
            translations[entityId] = t;
            const cacheKey = `${tableName}:${entityId}:${lang}`;
            if (this.cacheManager) await this.cacheManager.set(cacheKey, t);
          }
        }
      }
    }

    return entities.map((e) => {
      if (translations[e.id]) {
        return this.mapFields(e, translations[e.id]);
      }
      return e;
    });
  }

  private mapFields(entity: T, translation: Partial<U>): T {
    const result = { ...entity };
    for (const field of this.translatableFields) {
      if (translation[field as unknown as keyof U] !== undefined) {
        (result as Record<string, unknown>)[field as string] =
          translation[field as unknown as keyof U];
      }
    }
    return result;
  }
}
