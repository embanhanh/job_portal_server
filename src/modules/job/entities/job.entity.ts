import { Column, Entity, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ColumnNumericTransformer } from '../../../common/transformers/numeric.transformer';
import { BaseEntity } from '../../../common/base/base.entity';
import type { ITranslatableField } from '../../../common/interfaces/response.interface';
import { Company } from 'src/modules/company/entities/company.entity';
import { User } from 'src/modules/auth/entities/user.entity';
import { Category } from 'src/modules/master-data/entities/category.entity';
import { Location } from 'src/modules/master-data/entities/location.entity';
import { JobSkill } from './job-skill.entity';

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
  title!: ITranslatableField;

  description!: ITranslatableField;

  requirements?: ITranslatableField;

  benefits?: ITranslatableField;

  @Column({ name: 'employer_id' })
  employerId!: string;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employer_id' })
  employer!: User;

  @Column({ name: 'company_id', nullable: true })
  companyId?: string;

  @ManyToOne('Company', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'company_id' })
  company?: Company;

  @Column({ name: 'category_id', nullable: true })
  categoryId?: string;

  @ManyToOne('Category', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category?: Category;

  @Column({ name: 'location_id', nullable: true })
  locationId?: string;

  @ManyToOne('Location', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'location_id' })
  location?: Location;

  @Column({ type: 'enum', enum: JobType, default: JobType.FULL_TIME })
  type!: JobType;

  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.PENDING })
  status!: JobStatus;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  salaryMin?: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  salaryMax?: number;

  @Column({ type: 'varchar', length: 10, default: 'VND' })
  currency!: string;

  @Column({ type: 'timestamp', nullable: true, name: 'expired_at' })
  expiredAt?: Date;

  @OneToMany('JobSkill', 'job')
  jobSkills?: JobSkill[];
}
