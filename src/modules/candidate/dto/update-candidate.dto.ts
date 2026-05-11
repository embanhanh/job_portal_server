import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateEducationNestedDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  schoolName!: string;

  @IsOptional()
  @IsString()
  degree?: string;

  @IsOptional()
  @IsString()
  fieldOfStudy?: string;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateExperienceNestedDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  companyName!: string;

  @IsString()
  position!: string;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateCandidateProfileDto {
  @ApiPropertyOptional({
    example: { vi: 'Lập trình viên backend', en: 'Backend developer' },
  })
  @IsOptional()
  @IsObject()
  bio?: Record<string, string>;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isSearching?: boolean;

  @ApiPropertyOptional({ type: [UpdateEducationNestedDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateEducationNestedDto)
  educations?: UpdateEducationNestedDto[];

  @ApiPropertyOptional({ type: [UpdateExperienceNestedDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateExperienceNestedDto)
  experiences?: UpdateExperienceNestedDto[];

  @ApiPropertyOptional({ example: ['uuid-skill-1', 'uuid-skill-2'] })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  skillIds?: string[];
}
