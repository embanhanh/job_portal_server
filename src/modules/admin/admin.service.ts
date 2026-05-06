import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { CompanyService } from '../company/company.service';
import { JobService } from '../job/job.service';
import { UserStatus } from '../auth/enums/user-status.enum';
import { Role } from '../auth/enums/role.enum';
import { CompanyStatus } from '../company/enums/company-status.enum';

@Injectable()
export class AdminService {
  constructor(
    private readonly authService: AuthService,
    private readonly companyService: CompanyService,
    private readonly jobService: JobService,
  ) {}

  async banUser(id: string) {
    return this.authService.updateUserStatus(id, UserStatus.BANNED);
  }

  async unbanUser(id: string) {
    return this.authService.updateUserStatus(id, UserStatus.ACTIVE);
  }

  async approveJob(id: string) {
    return this.jobService.approveJob(id);
  }

  async rejectJob(id: string) {
    return this.jobService.rejectJob(id);
  }

  async approveCompany(id: string) {
    const company = await this.companyService.findOne(id);
    if (!company) throw new NotFoundException('Company not found');

    const updatedCompany = await this.companyService.update(id, {
      status: CompanyStatus.APPROVED,
    });

    await this.authService.updateUserRole(company.userId, Role.EMPLOYER);

    return updatedCompany;
  }

  async rejectCompany(id: string) {
    const company = await this.companyService.findOne(id);
    if (!company) throw new NotFoundException('Company not found');

    return this.companyService.update(id, {
      status: CompanyStatus.REJECTED,
    });
  }
}
