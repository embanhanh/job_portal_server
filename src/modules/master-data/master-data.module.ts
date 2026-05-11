import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Skill } from './entities/skill.entity';
import { Location } from './entities/location.entity';
import { Category } from './entities/category.entity';
import { CategoryTranslation } from './entities/category-translation.entity';
import { SkillTranslation } from './entities/skill-translation.entity';
import { LocationTranslation } from './entities/location-translation.entity';
import { SkillController } from './controllers/skill.controller';
import { LocationController } from './controllers/location.controller';
import { CategoryController } from './controllers/category.controller';
import { SkillService } from './services/skill.service';
import { LocationService } from './services/location.service';
import { CategoryService } from './services/category.service';
import { SkillRepository } from './repositories/skill.repository';
import { LocationRepository } from './repositories/location.repository';
import { CategoryRepository } from './repositories/category.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Skill,
      Location,
      Category,
      SkillTranslation,
      LocationTranslation,
      CategoryTranslation,
    ]),
  ],
  controllers: [SkillController, LocationController, CategoryController],
  providers: [
    SkillService,
    LocationService,
    CategoryService,
    SkillRepository,
    LocationRepository,
    CategoryRepository,
  ],
  exports: [
    SkillService,
    LocationService,
    CategoryService,
    SkillRepository,
    LocationRepository,
    CategoryRepository,
  ],
})
export class MasterDataModule {}
