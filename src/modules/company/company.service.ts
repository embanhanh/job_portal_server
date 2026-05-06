import { Injectable, Logger } from '@nestjs/common';
import { Company } from './entities/company.entity';
import { CompanyRepository } from './company.repository';
import { BaseService } from '../../common/base/base.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyProfileDto } from './dto/update-company.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CLOUDINARY_FOLDERS } from '../cloudinary/constants/cloudinary.constants';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CompanyStatus } from './enums/company-status.enum';

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

  async createCompany(
    userId: string,
    dto: CreateCompanyDto,
    files: {
      logo?: Express.Multer.File[];
      businessLicense?: Express.Multer.File[];
    },
  ): Promise<Company> {
    const existing = await this.companyRepository.findByUserId(userId);
    if (existing) {
      throw new ConflictException('User already has a company profile');
    }

    if (!files.businessLicense || files.businessLicense.length === 0) {
      throw new BadRequestException('Business license file is required');
    }

    const businessLicenseUpload = await this.cloudinaryService.uploadFile(
      files.businessLicense[0],
      CLOUDINARY_FOLDERS.COMPANY_DOCS,
    );

    let logoUrl: string | undefined;
    if (files.logo && files.logo.length > 0) {
      const logoUpload = await this.cloudinaryService.uploadFile(
        files.logo[0],
        CLOUDINARY_FOLDERS.COMPANY_LOGOS,
      );
      logoUrl = logoUpload.url;
    }

    return this.create({
      ...dto,
      userId,
      status: CompanyStatus.PENDING,
      businessLicenseUrl: businessLicenseUpload.url,
      logoUrl,
    });
  }

  async updateProfile(
    userId: string,
    dto: UpdateCompanyProfileDto,
    files?: {
      logo?: Express.Multer.File[];
      businessLicense?: Express.Multer.File[];
    },
  ): Promise<Company> {
    const company = await this.companyRepository.findByUserId(userId);
    if (!company) {
      throw new NotFoundException('Company profile not found');
    }

    const updates: Partial<Company> = { ...dto };

    if (files?.businessLicense && files.businessLicense.length > 0) {
      const upload = await this.cloudinaryService.uploadFile(
        files.businessLicense[0],
        CLOUDINARY_FOLDERS.COMPANY_DOCS,
      );
      updates.businessLicenseUrl = upload.url;
    }

    if (files?.logo && files.logo.length > 0) {
      const upload = await this.cloudinaryService.uploadFile(
        files.logo[0],
        CLOUDINARY_FOLDERS.COMPANY_LOGOS,
      );
      updates.logoUrl = upload.url;
    }

    return this.update(company.id, updates);
  }
}
