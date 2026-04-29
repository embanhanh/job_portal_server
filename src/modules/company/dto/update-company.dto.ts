import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, IsUrl } from 'class-validator';
import type { ITranslatableField } from '../../../common/interfaces/response.interface';

export class UpdateCompanyProfileDto {
  @ApiPropertyOptional({ example: 'Công ty Cổ phần Công nghệ ABC' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ example: 'https://example.com' })
  @IsOptional()
  @IsString()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({
    example: { vi: 'Mô tả công ty...', en: 'Company description...' },
  })
  @IsOptional()
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
