import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsArray,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ITranslatableField } from '../../../common/interfaces/response.interface';
import { JobType } from '../entities/job.entity';

export class TranslatableFieldDto implements ITranslatableField {
  @ApiProperty({ example: 'Nội dung tiếng Việt' })
  @IsString()
  @IsNotEmpty()
  vi!: string;

  @ApiProperty({ example: 'English content' })
  @IsString()
  @IsNotEmpty()
  en!: string;

  [key: string]: string;
}

export class CreateJobDto {
  @ApiProperty({ type: TranslatableFieldDto })
  @IsObject()
  @IsNotEmpty()
  title!: TranslatableFieldDto;

  @ApiProperty({ type: TranslatableFieldDto })
  @IsObject()
  @IsNotEmpty()
  description!: TranslatableFieldDto;

  @ApiPropertyOptional({ type: TranslatableFieldDto })
  @IsOptional()
  @IsObject()
  requirements?: TranslatableFieldDto;

  @ApiPropertyOptional({ type: TranslatableFieldDto })
  @IsOptional()
  @IsObject()
  benefits?: TranslatableFieldDto;

  @ApiPropertyOptional({ description: 'Category UUID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Location text (e.g. Ho Chi Minh)' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ enum: JobType, default: JobType.FULL_TIME })
  @IsOptional()
  @IsEnum(JobType)
  type?: JobType;

  @ApiPropertyOptional({ example: 15000000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  salaryMin?: number;

  @ApiPropertyOptional({ example: 30000000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  salaryMax?: number;

  @ApiPropertyOptional({ example: 'VND' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Array of Skill UUIDs',
    example: ['uuid-1', 'uuid-2'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  skillIds?: string[];

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  expiredAt?: string;
}
