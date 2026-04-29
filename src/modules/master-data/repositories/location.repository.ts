import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from '../entities/location.entity';
import { BaseRepository } from '../../../common/base/base.repository';

@Injectable()
export class LocationRepository extends BaseRepository<Location> {
  constructor(
    @InjectRepository(Location)
    repository: Repository<Location>,
  ) {
    super(repository);
  }

  async findBySlug(slug: string): Promise<Location | null> {
    return this.repository.findOne({ where: { slug } });
  }

  async findWithChildren(id: string): Promise<Location | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['children'],
    });
  }
}
