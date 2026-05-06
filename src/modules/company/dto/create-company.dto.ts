import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import type { ITranslatableField } from '../../../common/interfaces/response.interface';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Công ty Cổ phần Công nghệ ABC' })
  @IsNotEmpty()
  @IsString()
  companyName!: string;

  @ApiPropertyOptional({ example: 'https://example.com' })
  @IsOptional()
  @IsString()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({
    type: 'string',
    description: 'JSON string for translation or object',
    example: '{"vi": "Mô tả công ty...", "en": "Company description..."}',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      let cleaned = value.trim();
      if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.substring(1, cleaned.length - 1);
      }
      try {
        return JSON.parse(cleaned);
      } catch {
        return value;
      }
    }
    return value;
  })
  @IsObject()
  description?: ITranslatableField;

  @ApiPropertyOptional({ example: 'Tòa nhà X, Quận Y, TP.HCM' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Công nghệ thông tin' })
  @IsOptional()
  @IsString()
  industry?: string;
}
