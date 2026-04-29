import { ConflictException, Injectable } from '@nestjs/common';
import { Location } from '../entities/location.entity';
import { LocationRepository } from '../repositories/location.repository';
import { BaseService } from '../../../common/base/base.service';
import { CreateLocationDto } from '../dto/create-location.dto';

@Injectable()
export class LocationService extends BaseService<Location> {
  constructor(private readonly locationRepository: LocationRepository) {
    super(locationRepository);
  }

  async createLocation(dto: CreateLocationDto): Promise<Location> {
    const existing = await this.locationRepository.findBySlug(dto.slug);
    if (existing) {
      throw new ConflictException(
        `Location with slug "${dto.slug}" already exists`,
      );
    }
    return this.create(dto);
  }

  async updateLocation(
    id: string,
    dto: Partial<CreateLocationDto>,
  ): Promise<Location> {
    return this.update(id, dto);
  }

  async findBySlug(slug: string): Promise<Location | null> {
    return this.locationRepository.findBySlug(slug);
  }

  async findWithChildren(id: string): Promise<Location | null> {
    return this.locationRepository.findWithChildren(id);
  }
}
