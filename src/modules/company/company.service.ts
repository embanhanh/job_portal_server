import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Company } from './entities/company.entity';
import { CompanyRepository } from './company.repository';
import { BaseService } from '../../common/base/base.service';
import { AUTH_EVENTS } from '../auth/auth.service';
import { User } from '../auth/entities/user.entity';
import { Role } from '../auth/enums/role.enum';
import { UpdateCompanyProfileDto } from './dto/update-company.dto';
import { CloudinaryService } from '../application/cloudinary.service';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class CompanyService extends BaseService<Company> {
  private readonly logger = new Logger(CompanyService.name);

  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {
    super(companyRepository);
  }

  async findByUserId(userId: string): Promise<Company | null> {
    return this.companyRepository.findByUserId(userId);
  }

  async updateProfile(
    userId: string,
    dto: UpdateCompanyProfileDto,
  ): Promise<Company> {
    const company = await this.companyRepository.findByUserId(userId);
    if (!company) {
      throw new NotFoundException('Company profile not found');
    }
    return this.update(company.id, dto);
  }

  async uploadLogo(
    userId: string,
    file: Express.Multer.File,
  ): Promise<Company> {
    const company = await this.companyRepository.findByUserId(userId);
    if (!company) {
      throw new NotFoundException('Company profile not found');
    }
    const uploadResult = await this.cloudinaryService.uploadFile(file);
    return this.update(company.id, {
      logoUrl: uploadResult.url,
    });
  }

  async uploadBusinessLicense(
    userId: string,
    file: Express.Multer.File,
  ): Promise<Company> {
    const company = await this.companyRepository.findByUserId(userId);
    if (!company) {
      throw new NotFoundException('Company profile not found');
    }
    const uploadResult = await this.cloudinaryService.uploadFile(file);
    return this.update(company.id, {
      businessLicenseUrl: uploadResult.url,
    });
  }

  @OnEvent(AUTH_EVENTS.USER_REGISTERED)
  async handleUserRegistered(user: User): Promise<void> {
    if (user.role === Role.EMPLOYER || user.role === Role.ADMIN) {
      this.logger.log(
        `Auto-creating company profile for employer/admin user ${user.id}`,
      );
      try {
        await this.create({
          userId: user.id,
          companyName: user.fullName || 'Default Company Name',
        });
      } catch (error) {
        this.logger.error(
          `Failed to auto-create company for user ${user.id}`,
          error,
        );
      }
    }
  }
}
