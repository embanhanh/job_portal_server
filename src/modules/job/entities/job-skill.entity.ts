import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';

@Entity('job_skills')
@Unique(['jobId', 'skillId'])
export class JobSkill extends BaseEntity {
  @Column({ name: 'job_id' })
  jobId!: string;

  @ManyToOne('Job', 'jobSkills', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job!: import('./job.entity').Job;

  @Column({ name: 'skill_id' })
  skillId!: string;

  @ManyToOne('Skill', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'skill_id' })
  skill!: import('../../master-data/entities/skill.entity').Skill;
}
