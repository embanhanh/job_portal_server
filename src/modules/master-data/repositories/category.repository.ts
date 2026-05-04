import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { CategoryTranslation } from '../entities/category-translation.entity';
import { TranslatableRepository } from '../../../common/base/translatable.repository';

@Injectable()
export class CategoryRepository extends TranslatableRepository<
  Category,
  CategoryTranslation
> {
  constructor(
    @InjectRepository(Category)
    repository: Repository<Category>,
  ) {
    super(repository, CategoryTranslation, 'categoryId', [
      'name',
      'description',
    ]);
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const entity = await this.repository.findOne({ where: { slug } });
    if (!entity) return null;
    return this.applyTranslations(entity);
  }

  async findWithChildren(id: string): Promise<Category | null> {
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
