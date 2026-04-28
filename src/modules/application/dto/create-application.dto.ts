import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateApplicationDto {
  @ApiProperty({ description: 'Job ID to apply for' })
  @IsUUID()
  @IsNotEmpty()
  jobId!: string;

  @ApiPropertyOptional({ description: 'Cover letter text' })
  @IsOptional()
  @IsString()
  coverLetter?: string;
}
