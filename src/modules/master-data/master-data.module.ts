import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Skill } from './entities/skill.entity';
import { Category } from './entities/category.entity';
import { CategoryTranslation } from './entities/category-translation.entity';
import { SkillTranslation } from './entities/skill-translation.entity';
import { SkillController } from './controllers/skill.controller';
import { CategoryController } from './controllers/category.controller';
import { SkillService } from './services/skill.service';
import { CategoryService } from './services/category.service';
import { SkillRepository } from './repositories/skill.repository';
import { CategoryRepository } from './repositories/category.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Skill,
      Category,
      SkillTranslation,
      CategoryTranslation,
    ]),
  ],
  controllers: [SkillController, CategoryController],
  providers: [
    SkillService,
    CategoryService,
    SkillRepository,
    CategoryRepository,
  ],
  exports: [SkillService, CategoryService, SkillRepository, CategoryRepository],
})
export class MasterDataModule {}
