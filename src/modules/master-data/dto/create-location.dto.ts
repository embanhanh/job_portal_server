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

export class CreateLocationDto {
  @ApiProperty({ type: TranslatableFieldDto })
  @IsObject()
  @IsNotEmpty()
  name!: TranslatableFieldDto;

  @ApiProperty({ example: 'ho-chi-minh' })
  @IsString()
  @IsNotEmpty()
  slug!: string;

  @ApiPropertyOptional({ description: 'Parent location UUID' })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
