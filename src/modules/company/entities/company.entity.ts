import { Column, Entity, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';
import type { ITranslatableField } from '../../../common/interfaces/response.interface';
import { User } from 'src/modules/auth/entities/user.entity';

@Entity('companies')
export class Company extends BaseEntity {
  @Column({ name: 'user_id', unique: true })
  userId!: string;

  @OneToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'company_name' })
  companyName!: string;

  @Column({ name: 'logo_url', nullable: true })
  logoUrl?: string;

  @Column({ nullable: true })
  website?: string;

  description?: ITranslatableField;

  @Column({ name: 'business_license_url', nullable: true })
  businessLicenseUrl?: string;

  @Column({ name: 'is_verified', default: false })
  isVerified!: boolean;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  industry?: string;
}
