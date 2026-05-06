import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Candidate } from './entities/candidate.entity';
import { Education } from './entities/education.entity';
import { Experience } from './entities/experience.entity';
import { CandidateSkill } from './entities/candidate-skill.entity';
import { CandidateController } from './candidate.controller';
import { CandidateService } from './candidate.service';
import { CandidateRepository } from './candidate.repository';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { EducationRepository } from './repositories/education.repository';
import { ExperienceRepository } from './repositories/experience.repository';
import { CandidateSkillRepository } from './repositories/candidate-skill.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Candidate,
      Education,
      Experience,
      CandidateSkill,
    ]),
    CloudinaryModule,
  ],
  controllers: [CandidateController],
  providers: [
    CandidateService,
    CandidateRepository,
    EducationRepository,
    ExperienceRepository,
    CandidateSkillRepository,
  ],
  exports: [CandidateService],
})
export class CandidateModule {}
