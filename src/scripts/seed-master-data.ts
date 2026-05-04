import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CategoryRepository } from '../modules/master-data/repositories/category.repository';
import { SkillRepository } from '../modules/master-data/repositories/skill.repository';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('SeedMasterData');
  const app = await NestFactory.createApplicationContext(AppModule);

  const categoryRepo = app.get(CategoryRepository);
  const skillRepo = app.get(SkillRepository);

  const categories = [
    {
      name: { vi: 'Công nghệ thông tin', en: 'Information Technology' },
      slug: 'it',
      description: {
        vi: 'Các công việc liên quan đến lập trình, phần cứng, mạng...',
        en: 'Software development, hardware, networking...',
      },
      children: [
        {
          name: { vi: 'Phát triển phần mềm', en: 'Software Development' },
          slug: 'software-development',
          description: {
            vi: 'Lập trình ứng dụng Web, Mobile, Desktop...',
            en: 'Web, Mobile, Desktop application development...',
          },
        },
        {
          name: { vi: 'Khoa học dữ liệu', en: 'Data Science' },
          slug: 'data-science',
          description: {
            vi: 'Phân tích dữ liệu, AI, Machine Learning...',
            en: 'Data analysis, AI, Machine Learning...',
          },
        },
      ],
    },
    {
      name: { vi: 'Marketing & Quảng cáo', en: 'Marketing & Advertising' },
      slug: 'marketing',
      description: {
        vi: 'Tiếp thị, quản lý thương hiệu, truyền thông...',
        en: 'Marketing, brand management, communication...',
      },
    },
    {
      name: { vi: 'Tài chính & Kế toán', en: 'Finance & Accounting' },
      slug: 'finance',
      description: {
        vi: 'Quản lý tài chính, kế toán, kiểm toán...',
        en: 'Financial management, accounting, auditing...',
      },
    },
    {
      name: { vi: 'Nhân sự', en: 'Human Resources' },
      slug: 'hr',
      description: {
        vi: 'Tuyển dụng, đào tạo, quản lý nhân sự...',
        en: 'Recruitment, training, HR management...',
      },
    },
  ];

  const skills = [
    {
      name: { vi: 'Lập trình JavaScript', en: 'JavaScript Programming' },
      slug: 'javascript',
      category: 'IT',
    },
    {
      name: { vi: 'Lập trình TypeScript', en: 'TypeScript Programming' },
      slug: 'typescript',
      category: 'IT',
    },
    {
      name: { vi: 'Node.js Backend', en: 'Node.js Backend' },
      slug: 'nodejs',
      category: 'IT',
    },
    {
      name: { vi: 'React Frontend', en: 'React Frontend' },
      slug: 'react',
      category: 'IT',
    },
    {
      name: { vi: 'Lập trình Python', en: 'Python Programming' },
      slug: 'python',
      category: 'IT',
    },
    {
      name: { vi: 'Cơ sở dữ liệu SQL', en: 'SQL Database' },
      slug: 'sql',
      category: 'IT',
    },
    {
      name: { vi: 'Điện toán đám mây AWS', en: 'AWS Cloud' },
      slug: 'aws',
      category: 'IT',
    },
    {
      name: { vi: 'Docker & Container', en: 'Docker & Containers' },
      slug: 'docker',
      category: 'IT',
    },
    {
      name: { vi: 'Kỹ năng lãnh đạo', en: 'Leadership Skills' },
      slug: 'leadership',
      category: 'Soft Skills',
    },
    {
      name: { vi: 'Kỹ năng giao tiếp', en: 'Communication Skills' },
      slug: 'communication',
      category: 'Soft Skills',
    },
  ];

  logger.log('Starting Master Data seeding...');

  // Seed Categories
  for (const catData of categories) {
    const { children, ...parentData } = catData;

    // Check if exists
    let parent = await categoryRepo.findBySlug(parentData.slug);
    if (!parent) {
      parent = await categoryRepo.createEntity(parentData);
      logger.log(`Created category: ${parentData.slug}`);
    }

    if (children) {
      for (const childData of children) {
        const childExists = await categoryRepo.findBySlug(childData.slug);
        if (!childExists) {
          await categoryRepo.createEntity({
            ...childData,
            parentId: parent.id,
          });
          logger.log(`Created sub-category: ${childData.slug}`);
        }
      }
    }
  }

  // Seed Skills
  for (const skillData of skills) {
    const exists = await skillRepo.findBySlug(skillData.slug);
    if (!exists) {
      await skillRepo.createEntity(skillData);
      logger.log(`Created skill: ${skillData.slug}`);
    }
  }

  logger.log('Master Data seeding completed!');
  await app.close();
}

bootstrap().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
