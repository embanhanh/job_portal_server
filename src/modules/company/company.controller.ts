import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import type { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { UpdateCompanyProfileDto } from './dto/update-company.dto';
import { CreateCompanyDto } from './dto/create-company.dto';

@ApiTags('Companies')
@ApiBearerAuth('token')
@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYER, Role.CANDIDATE, Role.ADMIN)
  @ApiOperation({ summary: 'Get current company profile' })
  async getMyProfile(@Req() req: AuthenticatedRequest) {
    return this.companyService.findByUserId(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get company profile by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.companyService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'logo', maxCount: 1 },
      { name: 'businessLicense', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        companyName: { type: 'string', example: 'ABC Tech' },
        website: { type: 'string', example: 'https://abc.com' },
        address: { type: 'string', example: '123 Street' },
        industry: { type: 'string', example: 'IT' },
        description: {
          type: 'string',
          description: 'JSON string: {"vi": "...", "en": "..."}',
        },
        logo: { type: 'string', format: 'binary' },
        businessLicense: { type: 'string', format: 'binary' },
      },
      required: ['companyName', 'businessLicense'],
    },
  })
  @ApiOperation({ summary: 'Register a new company' })
  async createCompany(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateCompanyDto,
    @UploadedFiles()
    files: {
      logo?: Express.Multer.File[];
      businessLicense?: Express.Multer.File[];
    },
  ) {
    return this.companyService.createCompany(req.user.id, dto, files);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYER, Role.ADMIN)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'logo', maxCount: 1 },
      { name: 'businessLicense', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        companyName: { type: 'string', example: 'ABC Tech' },
        website: { type: 'string', example: 'https://abc.com' },
        address: { type: 'string', example: '123 Street' },
        industry: { type: 'string', example: 'IT' },
        description: {
          type: 'string',
          description: 'JSON string: {"vi": "...", "en": "..."}',
        },
        logo: { type: 'string', format: 'binary' },
        businessLicense: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Update current company profile' })
  async updateMyProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateCompanyProfileDto,
    @UploadedFiles()
    files: {
      logo?: Express.Multer.File[];
      businessLicense?: Express.Multer.File[];
    },
  ) {
    return this.companyService.updateProfile(req.user.id, dto, files);
  }
}
