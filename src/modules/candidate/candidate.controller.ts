import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CandidateService } from './candidate.service';
import { Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import type { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { CreateEducationDto, UpdateEducationDto } from './dto/education.dto';
import { CreateExperienceDto, UpdateExperienceDto } from './dto/experience.dto';
import { UpdateCandidateProfileDto } from './dto/update-candidate.dto';

@ApiTags('Candidates')
@ApiBearerAuth('token')
@Controller('candidates')
export class CandidateController {
  private readonly logger = new Logger(CandidateController.name);

  constructor(private readonly candidateService: CandidateService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  @ApiOperation({ summary: 'Get current candidate profile' })
  async getMyProfile(@Req() req: AuthenticatedRequest) {
    this.logger.debug(`Fetching profile for candidate user ID: ${req.user.id}`);
    return this.candidateService.findByUserId(req.user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  @ApiOperation({ summary: 'Update current candidate profile' })
  async updateMyProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateCandidateProfileDto,
  ) {
    return this.candidateService.updateProfile(req.user.id, dto);
  }

  @Post('me/cv')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload CV to profile' })
  async uploadCv(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.candidateService.uploadCv(req.user.id, file);
  }

  // ── Education ──────────────────────────────────────────────────────

  @Post('me/education')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  @ApiOperation({ summary: 'Add education to profile' })
  async addEducation(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateEducationDto,
  ) {
    return this.candidateService.addEducation(req.user.id, dto);
  }

  @Patch('me/education/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  @ApiOperation({ summary: 'Update education' })
  async updateEducation(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEducationDto,
  ) {
    return this.candidateService.updateEducation(req.user.id, id, dto);
  }

  @Delete('me/education/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  @ApiOperation({ summary: 'Delete education' })
  async deleteEducation(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.candidateService.deleteEducation(req.user.id, id);
  }

  // ── Experience ─────────────────────────────────────────────────────

  @Post('me/experience')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  @ApiOperation({ summary: 'Add experience to profile' })
  async addExperience(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateExperienceDto,
  ) {
    return this.candidateService.addExperience(req.user.id, dto);
  }

  @Patch('me/experience/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  @ApiOperation({ summary: 'Update experience' })
  async updateExperience(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExperienceDto,
  ) {
    return this.candidateService.updateExperience(req.user.id, id, dto);
  }

  @Delete('me/experience/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  @ApiOperation({ summary: 'Delete experience' })
  async deleteExperience(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.candidateService.deleteExperience(req.user.id, id);
  }

  // ── Skills ─────────────────────────────────────────────────────────

  @Patch('me/skills')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  @ApiOperation({ summary: 'Sync candidate skills' })
  async syncSkills(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { skillIds: string[] },
  ) {
    return this.candidateService.syncSkills(req.user.id, dto.skillIds);
  }

  // ── Public & Employer Access ───────────────────────────────────────

  @Get('search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYER, Role.ADMIN)
  @ApiOperation({ summary: 'Search candidates by skills (Employer/Admin)' })
  async searchCandidates(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('skills') skills?: string, // Comma separated UUIDs
  ) {
    const skillIds = skills ? skills.split(',') : undefined;
    return this.candidateService.searchCandidates(+page, +limit, skillIds);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get candidate profile by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.candidateService.findOne(id);
  }
}
