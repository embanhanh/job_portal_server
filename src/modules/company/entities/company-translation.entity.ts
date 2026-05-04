import { Column, Entity, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';
import { Company } from './company.entity';

@Entity('company_translations')
@Index(['companyId', 'language'], { unique: true })
export class CompanyTranslation extends BaseEntity {
  @Column({ name: 'company_id' })
  companyId!: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company!: Company;

  @Column()
  language!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;
}
