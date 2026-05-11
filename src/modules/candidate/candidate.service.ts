import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DataSource, DeepPartial } from 'typeorm';
import { Candidate } from './entities/candidate.entity';
import { CandidateSkill } from './entities/candidate-skill.entity';
import { Education } from './entities/education.entity';
import { Experience } from './entities/experience.entity';
import { CandidateRepository } from './candidate.repository';
import { EducationRepository } from './repositories/education.repository';
import { ExperienceRepository } from './repositories/experience.repository';
import { CandidateSkillRepository } from './repositories/candidate-skill.repository';
import { BaseService } from '../../common/base/base.service';
import { AUTH_EVENTS } from '../auth/auth.service';
import { User } from '../auth/entities/user.entity';
import { Role } from '../auth/enums/role.enum';
import { CreateEducationDto, UpdateEducationDto } from './dto/education.dto';
import { UpdateCandidateProfileDto } from './dto/update-candidate.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CLOUDINARY_FOLDERS } from '../cloudinary/constants/cloudinary.constants';
import { CreateExperienceDto, UpdateExperienceDto } from './dto/experience.dto';
import { SkillRepository } from '../master-data/repositories/skill.repository';

@Injectable()
export class CandidateService extends BaseService<Candidate> {
  private readonly logger = new Logger(CandidateService.name);

  constructor(
    private readonly candidateRepository: CandidateRepository,
    private readonly educationRepository: EducationRepository,
    private readonly experienceRepository: ExperienceRepository,
    private readonly candidateSkillRepository: CandidateSkillRepository,
    private readonly skillRepository: SkillRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly dataSource: DataSource,
  ) {
    super(candidateRepository);
  }

  async findByUserId(userId: string): Promise<Candidate | null> {
    const candidate = await this.candidateRepository.findByUserId(userId);
    return this.translateCandidate(candidate);
  }

  async updateProfile(
    userId: string,
    dto: UpdateCandidateProfileDto,
  ): Promise<Candidate | null> {
    const candidate = await this.candidateRepository.findByUserId(userId);
    if (!candidate) {
      throw new NotFoundException('Candidate profile not found');
    }

    const { educations, experiences, skillIds, ...candidateData } = dto;

    await this.dataSource.transaction(async (manager) => {
      // 1. Update Candidate basic info
      if (Object.keys(candidateData).length > 0) {
        await manager.update(Candidate, candidate.id, candidateData);
      }

      // 2. Sync Educations
      if (educations) {
        const existingEducationIds =
          candidate.educations?.map((e) => e.id) || [];
        const incomingEducationIds = educations
          .filter((e) => e.id)
          .map((e) => e.id as string);

        // Delete items not in incoming list
        const toDelete = existingEducationIds.filter(
          (id) => !incomingEducationIds.includes(id),
        );
        if (toDelete.length > 0) {
          await manager.delete(Education, toDelete);
        }

        // Upsert items
        for (const edu of educations) {
          if (edu.id && existingEducationIds.includes(edu.id)) {
            await manager.update(Education, edu.id, {
              ...edu,
              candidateId: candidate.id,
            });
          } else {
            const newEdu = manager.create(Education, {
              ...edu,
              candidateId: candidate.id,
            });
            await manager.save(newEdu);
          }
        }
      }

      // 3. Sync Experiences
      if (experiences) {
        const existingExpIds = candidate.experiences?.map((e) => e.id) || [];
        const incomingExpIds = experiences
          .filter((e) => e.id)
          .map((e) => e.id as string);

        const toDelete = existingExpIds.filter(
          (id) => !incomingExpIds.includes(id),
        );
        if (toDelete.length > 0) {
          await manager.delete(Experience, toDelete);
        }

        for (const exp of experiences) {
          if (exp.id && existingExpIds.includes(exp.id)) {
            await manager.update(Experience, exp.id, {
              ...exp,
              candidateId: candidate.id,
            });
          } else {
            const newExp = manager.create(Experience, {
              ...exp,
              candidateId: candidate.id,
            });
            await manager.save(newExp);
          }
        }
      }

      // 4. Sync Skills
      if (skillIds) {
        await manager.delete(CandidateSkill, { candidateId: candidate.id });
        if (skillIds.length > 0) {
          const skills = skillIds.map((skillId) =>
            manager.create(CandidateSkill, {
              candidateId: candidate.id,
              skillId,
            }),
          );
          await manager.save(skills);
        }
      }
    });

    const updatedCandidate =
      await this.candidateRepository.findByUserId(userId);
    return this.translateCandidate(updatedCandidate);
  }

  async searchCandidates(page: number, limit: number, skillIds?: string[]) {
    const result = await this.candidateRepository.findWithFilters(
      page,
      limit,
      skillIds,
    );
    result.data = (await Promise.all(
      result.data.map((c) => this.translateCandidate(c)),
    )) as Candidate[];
    return result;
  }

  async uploadCv(
    userId: string,
    file: Express.Multer.File,
  ): Promise<Candidate> {
    const candidate = await this.candidateRepository.findByUserId(userId);
    if (!candidate) {
      throw new NotFoundException('Candidate profile not found');
    }

    const uploadResult = await this.cloudinaryService.uploadFile(
      file,
      CLOUDINARY_FOLDERS.RESUMES,
    );
    return this.update(candidate.id, {
      currentCvUrl: uploadResult.url,
    });
  }

  // ── Education ──────────────────────────────────────────────────────

  async addEducation(userId: string, dto: CreateEducationDto) {
    const candidate = await this.candidateRepository.findByUserId(userId);
    if (!candidate) throw new NotFoundException('Candidate profile not found');

    return this.educationRepository.createEntity({
      ...dto,
      candidateId: candidate.id,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    });
  }

  async updateEducation(
    userId: string,
    educationId: string,
    dto: UpdateEducationDto,
  ) {
    const candidate = await this.candidateRepository.findByUserId(userId);
    if (!candidate) throw new NotFoundException('Candidate profile not found');

    const education = await this.educationRepository.findById(educationId);
    if (!education || education.candidateId !== candidate.id) {
      throw new NotFoundException(
        'Education not found or belongs to another candidate',
      );
    }

    return this.educationRepository.updateEntity(educationId, {
      ...dto,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    });
  }

  async deleteEducation(userId: string, educationId: string) {
    const candidate = await this.candidateRepository.findByUserId(userId);
    if (!candidate) throw new NotFoundException('Candidate profile not found');

    const education = await this.educationRepository.findById(educationId);
    if (!education || education.candidateId !== candidate.id) {
      throw new NotFoundException(
        'Education not found or belongs to another candidate',
      );
    }

    return this.educationRepository.hardDelete(educationId);
  }

  // ── Experience ─────────────────────────────────────────────────────

  async addExperience(userId: string, dto: CreateExperienceDto) {
    const candidate = await this.candidateRepository.findByUserId(userId);
    if (!candidate) throw new NotFoundException('Candidate profile not found');

    return this.experienceRepository.createEntity({
      ...dto,
      candidateId: candidate.id,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    });
  }

  async updateExperience(
    userId: string,
    experienceId: string,
    dto: UpdateExperienceDto,
  ) {
    const candidate = await this.candidateRepository.findByUserId(userId);
    if (!candidate) throw new NotFoundException('Candidate profile not found');

    const experience = await this.experienceRepository.findById(experienceId);
    if (!experience || experience.candidateId !== candidate.id) {
      throw new NotFoundException(
        'Experience not found or belongs to another candidate',
      );
    }

    return this.experienceRepository.updateEntity(experienceId, {
      ...dto,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    });
  }

  async deleteExperience(userId: string, experienceId: string) {
    const candidate = await this.candidateRepository.findByUserId(userId);
    if (!candidate) throw new NotFoundException('Candidate profile not found');

    const experience = await this.experienceRepository.findById(experienceId);
    if (!experience || experience.candidateId !== candidate.id) {
      throw new NotFoundException(
        'Experience not found or belongs to another candidate',
      );
    }

    return this.experienceRepository.hardDelete(experienceId);
  }

  // ── Skills ─────────────────────────────────────────────────────────

  async syncSkills(userId: string, skillIds: string[]) {
    const candidate = await this.candidateRepository.findByUserId(userId);
    if (!candidate) throw new NotFoundException('Candidate profile not found');

    // Remove existing skills
    await this.candidateSkillRepository.deleteByCandidateId(candidate.id);

    // Add new skills
    if (skillIds.length > 0) {
      const skills = skillIds.map((skillId) => ({
        candidateId: candidate.id,
        skillId,
      }));

      // We can use repository to save multiple
      await Promise.all(
        skills.map((s) =>
          this.candidateSkillRepository.createEntity(
            s as DeepPartial<CandidateSkill>,
          ),
        ),
      );
    }

    const updatedCandidate =
      await this.candidateRepository.findByUserId(userId);
    return this.translateCandidate(updatedCandidate);
  }

  private async translateCandidate(
    candidate: Candidate | null,
  ): Promise<Candidate | null> {
    if (!candidate) return null;

    if (candidate.candidateSkills && candidate.candidateSkills.length > 0) {
      const skills = candidate.candidateSkills
        .map((cs) => cs.skill)
        .filter(Boolean);
      if (skills.length > 0) {
        const translatedSkills =
          await this.skillRepository.applyTranslationsMany(skills);
        // Map translated skills back to candidateSkills
        candidate.candidateSkills.forEach((cs) => {
          if (cs.skill) {
            const translated = translatedSkills.find(
              (ts) => ts.id === cs.skill.id,
            );
            if (translated) {
              cs.skill = translated;
            }
          }
        });
      }
    }

    return candidate;
  }

  @OnEvent(AUTH_EVENTS.USER_REGISTERED)
  async handleUserRegistered(user: User): Promise<void> {
    if (user.role === Role.CANDIDATE) {
      this.logger.log(`Auto-creating candidate profile for user ${user.id}`);
      try {
        await this.create({
          userId: user.id,
        });
      } catch (error) {
        this.logger.error(
          `Failed to auto-create candidate for user ${user.id}`,
          error,
        );
      }
    }
  }
}
