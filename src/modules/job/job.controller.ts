import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JobService } from './job.service';
import { JobElasticsearchListener } from './job-elasticsearch.listener';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import type { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

@ApiTags('Jobs')
@ApiBearerAuth('token')
@Controller('jobs')
export class JobController {
  constructor(
    private readonly jobService: JobService,
    private readonly esListener: JobElasticsearchListener,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all open jobs with pagination' })
  async findAll(
    @Query() pagination: PaginationDto,
    @Headers('accept-language') acceptLang?: string,
  ) {
    const resolvedLang = acceptLang?.split(',')[0]?.trim() ?? 'vi';
    return this.jobService.findAllJobs(pagination, resolvedLang);
  }

  @Get('search')
  @ApiOperation({ summary: 'Full-text search jobs via Elasticsearch' })
  async search(
    @Query('q') query: string,
    @Query('from') from?: number,
    @Query('size') size?: number,
  ) {
    return this.esListener.searchJobs(query, from, size);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a job by ID' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('accept-language') acceptLang?: string,
  ) {
    const resolvedLang = acceptLang?.split(',')[0]?.trim() ?? 'vi';
    return this.jobService.findOneJob(id, resolvedLang);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYER, Role.ADMIN)
  @ApiOperation({ summary: 'Create a new job (Employer/Admin only)' })
  async create(@Body() dto: CreateJobDto, @Req() req: AuthenticatedRequest) {
    return this.jobService.createJob(dto, req.user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYER, Role.ADMIN)
  @ApiOperation({ summary: 'Update a job (Employer/Admin only)' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateJobDto,
  ) {
    return this.jobService.updateJob(id, dto);
  }

  @Patch(':id/close')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYER, Role.ADMIN)
  @ApiOperation({ summary: 'Close a job (Employer/Admin only)' })
  async close(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobService.closeJob(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYER, Role.ADMIN)
  @ApiOperation({ summary: 'Soft-delete a job (Employer/Admin only)' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobService.deleteJob(id);
  }

  @Post(':id/save')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  @ApiOperation({ summary: 'Toggle save/unsave a job (Candidate only)' })
  async toggleSave(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.jobService.toggleSaveJob(req.user.id, id);
  }
}
