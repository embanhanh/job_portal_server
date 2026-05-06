import {
  Controller,
  Patch,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@ApiBearerAuth('token')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Patch('users/:id/ban')
  @ApiOperation({ summary: 'Ban a user' })
  async banUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.banUser(id);
  }

  @Patch('users/:id/unban')
  @ApiOperation({ summary: 'Unban a user' })
  async unbanUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.unbanUser(id);
  }

  @Patch('jobs/:id/approve')
  @ApiOperation({ summary: 'Approve a job' })
  async approveJob(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.approveJob(id);
  }

  @Patch('jobs/:id/reject')
  @ApiOperation({ summary: 'Reject a job' })
  async rejectJob(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.rejectJob(id);
  }

  @Patch('companies/:id/approve')
  @ApiOperation({ summary: 'Approve a company' })
  async approveCompany(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.approveCompany(id);
  }

  @Patch('companies/:id/reject')
  @ApiOperation({ summary: 'Reject a company' })
  async rejectCompany(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.rejectCompany(id);
  }
}
