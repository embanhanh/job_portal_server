import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateApplicationDto {
  @ApiProperty({ description: 'Job ID to apply for' })
  @IsUUID()
  @IsNotEmpty()
  jobId!: string;

  @ApiProperty({ description: 'Full name of the candidate' })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ description: 'Phone number of the candidate' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiPropertyOptional({ description: 'Cover letter text' })
  @IsOptional()
  @IsString()
  coverLetter?: string;
}
