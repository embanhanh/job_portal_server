import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DeepPartial } from 'typeorm';
import { Candidate } from './entities/candidate.entity';
import { CandidateSkill } from './entities/candidate-skill.entity';
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

@Injectable()
export class CandidateService extends BaseService<Candidate> {
  private readonly logger = new Logger(CandidateService.name);

  constructor(
    private readonly candidateRepository: CandidateRepository,
    private readonly educationRepository: EducationRepository,
    private readonly experienceRepository: ExperienceRepository,
    private readonly candidateSkillRepository: CandidateSkillRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {
    super(candidateRepository);
  }

  async findByUserId(userId: string): Promise<Candidate | null> {
    return this.candidateRepository.findByUserId(userId);
  }

  async updateProfile(
    userId: string,
    dto: UpdateCandidateProfileDto,
  ): Promise<Candidate> {
    const candidate = await this.candidateRepository.findByUserId(userId);
    if (!candidate) {
      throw new NotFoundException('Candidate profile not found');
    }
    return this.update(candidate.id, dto);
  }

  async searchCandidates(page: number, limit: number, skillIds?: string[]) {
    return this.candidateRepository.findWithFilters(page, limit, skillIds);
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

    return this.candidateRepository.findByUserId(userId);
  }

  @OnEvent(AUTH_EVENTS.USER_REGISTERED)
  async handleUserRegistered(user: User): Promise<void> {
    if (user.role === Role.CANDIDATE) {
      this.logger.log(`Auto-creating candidate profile for user ${user.id}`);
      try {
        await this.create({
          userId: user.id,
          fullName: user.fullName,
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
