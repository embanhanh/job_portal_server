import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';

@Entity('saved_jobs')
@Unique(['candidateId', 'jobId'])
export class SavedJob extends BaseEntity {
  @Column({ name: 'candidate_id' })
  candidateId!: string;

  @ManyToOne('Candidate', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidate_id' })
  candidate!: import('../../candidate/entities/candidate.entity').Candidate;

  @Column({ name: 'job_id' })
  jobId!: string;

  @ManyToOne('Job', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job!: import('./job.entity').Job;
}
