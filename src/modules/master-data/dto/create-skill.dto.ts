import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
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

export class CreateSkillDto {
  @ApiProperty({ type: TranslatableFieldDto })
  @IsObject()
  @IsNotEmpty()
  name!: TranslatableFieldDto;

  @ApiProperty({ example: 'nestjs' })
  @IsString()
  @IsNotEmpty()
  slug!: string;

  @ApiPropertyOptional({ example: 'Backend' })
  @IsOptional()
  @IsString()
  category?: string;
}
