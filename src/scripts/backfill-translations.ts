import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { Job } from '../modules/job/entities/job.entity';
import { Category } from '../modules/master-data/entities/category.entity';
import { Skill } from '../modules/master-data/entities/skill.entity';
import { Company } from '../modules/company/entities/company.entity';
import { JobTranslation } from '../modules/job/entities/job-translation.entity';
import { CategoryTranslation } from '../modules/master-data/entities/category-translation.entity';
import { SkillTranslation } from '../modules/master-data/entities/skill-translation.entity';
import { CompanyTranslation } from '../modules/company/entities/company-translation.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  console.log('--- Starting Backfill Process ---');

  await backfillJobTranslations(dataSource);
  await backfillCategoryTranslations(dataSource);
  await backfillSkillTranslations(dataSource);

  await backfillCompanyTranslations(dataSource);

  console.log('--- Backfill Complete ---');
  await app.close();
}

async function backfillJobTranslations(dataSource: DataSource) {
  console.log('Backfilling Job translations...');
  const repo = dataSource.getRepository(Job);
  const transRepo = dataSource.getRepository(JobTranslation);

  const jobs = await repo.find();
  for (const job of jobs) {
    const langs = ['vi', 'en'];
    for (const lang of langs) {
      const titleObj = job.title as unknown as Record<string, string>;
      const descObj = job.description as unknown as Record<string, string>;
      const reqObj = job.requirements as unknown as Record<string, string>;
      const benObj = job.benefits as unknown as Record<string, string>;

      if (titleObj && titleObj[lang]) {
        await transRepo.save({
          jobId: job.id,
          language: lang,
          title: titleObj[lang] || '',
          description: descObj ? descObj[lang] || '' : '',
          requirements: reqObj ? reqObj[lang] || '' : '',
          benefits: benObj ? benObj[lang] || '' : '',
        });
      }
    }
  }
  console.log(`Successfully processed ${jobs.length} Jobs.`);
}

async function backfillCategoryTranslations(dataSource: DataSource) {
  console.log('Backfilling Category translations...');
  const repo = dataSource.getRepository(Category);
  const transRepo = dataSource.getRepository(CategoryTranslation);

  const categories = await repo.find();
  for (const category of categories) {
    const langs = ['vi', 'en'];
    for (const lang of langs) {
      const nameObj = category.name as unknown as Record<string, string>;
      const descObj = category.description as unknown as Record<string, string>;

      if (nameObj && nameObj[lang]) {
        await transRepo.save({
          categoryId: category.id,
          language: lang,
          name: nameObj[lang] || '',
          description: descObj ? descObj[lang] || '' : '',
        });
      }
    }
  }
  console.log(`Successfully processed ${categories.length} Categories.`);
}

async function backfillSkillTranslations(dataSource: DataSource) {
  console.log('Backfilling Skill translations...');
  const repo = dataSource.getRepository(Skill);
  const transRepo = dataSource.getRepository(SkillTranslation);

  const items = await repo.find();
  for (const item of items) {
    const langs = ['vi', 'en'];
    for (const lang of langs) {
      const nameObj = item.name as unknown as Record<string, string>;

      if (nameObj && nameObj[lang]) {
        await transRepo.save({
          skillId: item.id,
          language: lang,
          name: nameObj[lang] || '',
        });
      }
    }
  }
  console.log(`Successfully processed ${items.length} Skills.`);
}

async function backfillCompanyTranslations(dataSource: DataSource) {
  console.log('Backfilling Company translations...');
  const repo = dataSource.getRepository(Company);
  const transRepo = dataSource.getRepository(CompanyTranslation);

  const items = await repo.find();
  for (const item of items) {
    const langs = ['vi', 'en'];
    for (const lang of langs) {
      const descObj = item.description as unknown as Record<string, string>;

      if (descObj && descObj[lang]) {
        await transRepo.save({
          companyId: item.id,
          language: lang,
          description: descObj[lang] || '',
        });
      }
    }
  }
  console.log(`Successfully processed ${items.length} Companies.`);
}

bootstrap().catch((err) => {
  console.error('Failed to run backfill script:', err);
  process.exit(1);
});
