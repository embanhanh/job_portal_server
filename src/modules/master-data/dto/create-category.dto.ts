import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ITranslatableField } from '../../../common/interfaces/response.interface';

class TranslatableFieldDto implements ITranslatableField {
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

export class CreateCategoryDto {
  @ApiProperty({ type: TranslatableFieldDto })
  @IsObject()
  @IsNotEmpty()
  name!: TranslatableFieldDto;

  @ApiProperty({ example: 'it-software' })
  @IsString()
  @IsNotEmpty()
  slug!: string;

  @ApiPropertyOptional({ type: TranslatableFieldDto })
  @IsOptional()
  @IsObject()
  description?: TranslatableFieldDto;

  @ApiPropertyOptional({ description: 'Parent category UUID' })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
