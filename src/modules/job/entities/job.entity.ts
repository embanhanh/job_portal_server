import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';
import type { ITranslatableField } from '../../../common/interfaces/response.interface';
import type { User } from '../../auth/entities/user.entity';

export enum JobStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CLOSED = 'closed',
  EXPIRED = 'expired',
}

export enum JobType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  INTERNSHIP = 'internship',
  REMOTE = 'remote',
}

@Entity('jobs')
export class Job extends BaseEntity {
  @Column({ type: 'jsonb' })
  title!: ITranslatableField;

  @Column({ type: 'jsonb' })
  description!: ITranslatableField;

  @Column({ type: 'jsonb', nullable: true })
  requirements?: ITranslatableField;

  @Column({ type: 'jsonb', nullable: true })
  benefits?: ITranslatableField;

  @Column({ type: 'varchar', length: 255 })
  company!: string;

  @Column({ type: 'varchar', length: 255 })
  location!: string;

  @Column({ type: 'enum', enum: JobType, default: JobType.FULL_TIME })
  type!: JobType;

  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.DRAFT })
  status!: JobStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  salaryMin?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  salaryMax?: number;

  @Column({ type: 'varchar', length: 10, default: 'VND' })
  currency!: string;

  @Column({ type: 'simple-array', nullable: true })
  skills?: string[];

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @Column({ name: 'employer_id' })
  employerId!: string;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employer_id' })
  employer!: User;
}
