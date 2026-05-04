import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkillService } from '../services/skill.service';
import { CreateSkillDto } from '../dto/create-skill.dto';
import { UpdateSkillDto } from '../dto/update-skill.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';

@ApiTags('Skills')
@ApiHeader({
  name: 'accept-language',
  required: false,
  description: 'Ngôn ngữ (vi, en)',
  example: 'vi',
})
@Controller('skills')
export class SkillController {
  constructor(private readonly skillService: SkillService) {}

  @Get()
  @ApiOperation({ summary: 'Get all skills with pagination' })
  async findAll(@Query() pagination: PaginationDto) {
    return this.skillService.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a skill by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.skillService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new skill (Admin only)' })
  async create(@Body() dto: CreateSkillDto) {
    return this.skillService.createSkill(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a skill (Admin only)' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSkillDto,
  ) {
    return this.skillService.updateSkill(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a skill (Admin only)' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.skillService.softDelete(id);
  }
}
