import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { BaseRepository } from '../../../common/base/base.repository';

@Injectable()
export class CategoryRepository extends BaseRepository<Category> {
  constructor(
    @InjectRepository(Category)
    repository: Repository<Category>,
  ) {
    super(repository);
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return this.repository.findOne({ where: { slug } });
  }

  async findWithChildren(id: string): Promise<Category | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['children'],
    });
  }
}
