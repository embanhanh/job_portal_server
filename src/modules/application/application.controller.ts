import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApplicationService } from './application.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ApplicationStatus } from './enums/application-status';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import type { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

@ApiTags('Applications')
@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Post()
  @Roles(Role.CANDIDATE)
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('cv'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Apply for a job with optional CV upload' })
  async apply(
    @Body() dto: CreateApplicationDto,
    @UploadedFile() cvFile: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.applicationService.apply(
      req.user.id,
      dto.jobId,
      dto.fullName,
      dto.phone,
      dto.coverLetter,
      cvFile,
    );
  }

  @Get('my')
  @Roles(Role.CANDIDATE)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get my applications (Candidate)' })
  async myApplications(
    @Query() pagination: PaginationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.applicationService.findByCandidate(req.user.id, pagination);
  }

  @Get('job/:jobId')
  @Roles(Role.EMPLOYER, Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get applications for a job (Employer/Admin)' })
  async jobApplications(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.applicationService.findByJob(jobId, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get application details' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.applicationService.findOne(id);
  }

  @Patch(':id/status')
  @Roles(Role.EMPLOYER, Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update application status (Employer/Admin)' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: ApplicationStatus,
  ) {
    return this.applicationService.updateApplicationStatus(id, status);
  }
}
