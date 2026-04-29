import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Candidate } from './entities/candidate.entity';
import { Education } from './entities/education.entity';
import { Experience } from './entities/experience.entity';
import { CandidateSkill } from './entities/candidate-skill.entity';
import { CandidateController } from './candidate.controller';
import { CandidateService } from './candidate.service';
import { CandidateRepository } from './candidate.repository';
import { ApplicationModule } from '../application/application.module';
import { EducationRepository } from './repositories/education.repository';
import { ExperienceRepository } from './repositories/experience.repository';
import { CandidateSkillRepository } from './repositories/candidate-skill.repository';
import { CloudinaryService } from '../application/cloudinary.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Candidate,
      Education,
      Experience,
      CandidateSkill,
    ]),
    ApplicationModule,
  ],
  controllers: [CandidateController],
  providers: [
    CandidateService,
    CandidateRepository,
    EducationRepository,
    ExperienceRepository,
    CandidateSkillRepository,
    CloudinaryService,
  ],
  exports: [CandidateService],
})
export class CandidateModule {}
