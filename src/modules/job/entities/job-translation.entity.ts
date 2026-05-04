import { Column, Entity, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';
import { Job } from './job.entity';

@Entity('job_translations')
@Index(['jobId', 'language'], { unique: true })
export class JobTranslation extends BaseEntity {
  @Column({ name: 'job_id' })
  jobId!: string;

  @ManyToOne(() => Job, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job!: Job;

  @Column()
  language!: string;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'text', nullable: true })
  requirements?: string;

  @Column({ type: 'text', nullable: true })
  benefits?: string;
}
