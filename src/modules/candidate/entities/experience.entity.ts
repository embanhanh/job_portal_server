import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';
import { Candidate } from './candidate.entity';

@Entity('experiences')
export class Experience extends BaseEntity {
  @Column({ name: 'candidate_id' })
  candidateId!: string;

  @ManyToOne('Candidate', 'experiences', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidate_id' })
  candidate!: Candidate;

  @Column({ name: 'company_name' })
  companyName!: string;

  @Column()
  position!: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate?: Date;

  @Column({ name: 'is_current', default: false })
  isCurrent!: boolean;

  @Column({ type: 'text', nullable: true })
  description?: string;
}
