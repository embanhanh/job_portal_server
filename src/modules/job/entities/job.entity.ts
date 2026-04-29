import { Column, Entity, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';
import type { ITranslatableField } from '../../../common/interfaces/response.interface';

export enum JobStatus {
  PENDING = 'pending',
  OPEN = 'open',
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

  @Column({ name: 'employer_id' })
  employerId!: string;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employer_id' })
  employer!: import('../../auth/entities/user.entity').User;

  @Column({ name: 'company_id', nullable: true })
  companyId?: string;

  @ManyToOne('Company', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'company_id' })
  company?: import('../../company/entities/company.entity').Company;

  @Column({ name: 'category_id', nullable: true })
  categoryId?: string;

  @ManyToOne('Category', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category?: import('../../master-data/entities/category.entity').Category;

  @Column({ name: 'location_id', nullable: true })
  locationId?: string;

  @ManyToOne('Location', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'location_id' })
  location?: import('../../master-data/entities/location.entity').Location;

  @Column({ type: 'enum', enum: JobType, default: JobType.FULL_TIME })
  type!: JobType;

  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.PENDING })
  status!: JobStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  salaryMin?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  salaryMax?: number;

  @Column({ type: 'varchar', length: 10, default: 'VND' })
  currency!: string;

  @Column({ type: 'timestamp', nullable: true, name: 'expired_at' })
  expiredAt?: Date;

  @OneToMany('JobSkill', 'job')
  jobSkills?: import('./job-skill.entity').JobSkill[];
}
