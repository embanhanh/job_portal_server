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
import { LocationService } from '../services/location.service';
import { CreateLocationDto } from '../dto/create-location.dto';
import { UpdateLocationDto } from '../dto/update-location.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';

@ApiTags('Locations')
@ApiHeader({
  name: 'accept-language',
  required: false,
  description: 'Ngôn ngữ (vi, en)',
  example: 'vi',
})
@Controller('locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all locations with pagination' })
  async findAll(@Query() pagination: PaginationDto) {
    return this.locationService.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a location by ID (with children)' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationService.findWithChildren(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new location (Admin only)' })
  async create(@Body() dto: CreateLocationDto) {
    return this.locationService.createLocation(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a location (Admin only)' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.locationService.updateLocation(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a location (Admin only)' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationService.softDelete(id);
  }
}
