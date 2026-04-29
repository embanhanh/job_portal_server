import {
  Controller,
  Patch,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JobService } from '../job/job.service';
import { CompanyService } from '../company/company.service';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { UserStatus } from '../auth/enums/user-status.enum';

@ApiTags('Admin')
@ApiBearerAuth('token')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(
    private readonly jobService: JobService,
    private readonly companyService: CompanyService,
    private readonly authService: AuthService,
  ) {}

  @Patch('users/:id/ban')
  @ApiOperation({ summary: 'Ban a user' })
  async banUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.authService.updateUserStatus(id, UserStatus.BANNED);
  }

  @Patch('users/:id/unban')
  @ApiOperation({ summary: 'Unban a user' })
  async unbanUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.authService.updateUserStatus(id, UserStatus.ACTIVE);
  }

  @Patch('jobs/:id/approve')
  @ApiOperation({ summary: 'Approve a job' })
  async approveJob(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobService.approveJob(id);
  }

  @Patch('jobs/:id/reject')
  @ApiOperation({ summary: 'Reject a job' })
  async rejectJob(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobService.rejectJob(id);
  }

  @Patch('companies/:id/verify')
  @ApiOperation({ summary: 'Verify a company' })
  async verifyCompany(@Param('id', ParseUUIDPipe) id: string) {
    return this.companyService.update(id, {
      isVerified: true,
    });
  }
}
