import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateExperienceDto {
  @ApiProperty({ example: 'FPT Software' })
  @IsString()
  @IsNotEmpty()
  companyName!: string;

  @ApiProperty({ example: 'Software Engineer' })
  @IsString()
  @IsNotEmpty()
  position!: string;

  @ApiProperty({ example: '2020-09-01' })
  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @ApiPropertyOptional({ example: '2022-09-01' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;

  @ApiPropertyOptional({
    example: { vi: 'Làm việc với React', en: 'Worked with React' },
  })
  @IsOptional()
  @IsObject()
  description?: Record<string, string>;
}

export class UpdateExperienceDto extends CreateExperienceDto {}
