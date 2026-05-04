import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';
import { Candidate } from './candidate.entity';

@Entity('education')
export class Education extends BaseEntity {
  @Column({ name: 'candidate_id' })
  candidateId!: string;

  @ManyToOne('Candidate', 'educations', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidate_id' })
  candidate!: Candidate;

  @Column({ name: 'school_name' })
  schoolName!: string;

  @Column({ nullable: true })
  degree?: string;

  @Column({ name: 'field_of_study', nullable: true })
  fieldOfStudy?: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate?: Date;

  @Column({ type: 'text', nullable: true })
  description?: string;
}
