import { ConflictException, Injectable } from '@nestjs/common';
import { Category } from '../entities/category.entity';
import { CategoryRepository } from '../repositories/category.repository';
import { BaseService } from '../../../common/base/base.service';
import { CreateCategoryDto } from '../dto/create-category.dto';

@Injectable()
export class CategoryService extends BaseService<Category> {
  constructor(private readonly categoryRepository: CategoryRepository) {
    super(categoryRepository);
  }

  async createCategory(dto: CreateCategoryDto): Promise<Category> {
    const existing = await this.categoryRepository.findBySlug(dto.slug);
    if (existing) {
      throw new ConflictException(
        `Category with slug "${dto.slug}" already exists`,
      );
    }
    return this.create(dto);
  }

  async updateCategory(
    id: string,
    dto: Partial<CreateCategoryDto>,
  ): Promise<Category> {
    return this.update(id, dto);
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return this.categoryRepository.findBySlug(slug);
  }

  async findWithChildren(id: string): Promise<Category | null> {
    return this.categoryRepository.findWithChildren(id);
  }
}
