import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from '../entities/location.entity';
import { LocationTranslation } from '../entities/location-translation.entity';
import { TranslatableRepository } from '../../../common/base/translatable.repository';

@Injectable()
export class LocationRepository extends TranslatableRepository<
  Location,
  LocationTranslation
> {
  constructor(
    @InjectRepository(Location)
    repository: Repository<Location>,
  ) {
    super(repository, LocationTranslation, 'locationId', ['name']);
  }

  async findBySlug(slug: string): Promise<Location | null> {
    const entity = await this.repository.findOne({ where: { slug } });
    if (!entity) return null;
    return this.applyTranslations(entity);
  }

  async findWithChildren(id: string): Promise<Location | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['children'],
    });
    if (!entity) return null;
    if (entity.children && entity.children.length > 0) {
      entity.children = await this.applyTranslationsMany(entity.children);
    }
    return this.applyTranslations(entity);
  }
}
