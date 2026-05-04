import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';
import { Candidate } from 'src/modules/candidate/entities/candidate.entity';
import { Job } from './job.entity';

@Entity('saved_jobs')
@Unique(['candidateId', 'jobId'])
export class SavedJob extends BaseEntity {
  @Column({ name: 'candidate_id' })
  candidateId!: string;

  @ManyToOne('Candidate', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidate_id' })
  candidate!: Candidate;

  @Column({ name: 'job_id' })
  jobId!: string;

  @ManyToOne('Job', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job!: Job;
}
