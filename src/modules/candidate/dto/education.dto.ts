import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateEducationDto {
  @ApiProperty({ example: 'Đại học Bách Khoa TP.HCM' })
  @IsString()
  @IsNotEmpty()
  schoolName!: string;

  @ApiPropertyOptional({ example: 'Bằng Cử nhân' })
  @IsOptional()
  @IsString()
  degree?: string;

  @ApiPropertyOptional({ example: 'Công nghệ thông tin' })
  @IsOptional()
  @IsString()
  fieldOfStudy?: string;

  @ApiProperty({ example: '2016-09-01' })
  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @ApiPropertyOptional({ example: '2020-09-01' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'Tốt nghiệp loại giỏi' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateEducationDto extends CreateEducationDto {}
