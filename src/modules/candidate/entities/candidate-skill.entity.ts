import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';
import { Candidate } from './candidate.entity';
import { Skill } from 'src/modules/master-data/entities/skill.entity';

@Entity('candidate_skills')
@Unique(['candidateId', 'skillId'])
export class CandidateSkill extends BaseEntity {
  @Column({ name: 'candidate_id' })
  candidateId!: string;

  @ManyToOne('Candidate', 'candidateSkills', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidate_id' })
  candidate!: Candidate;

  @Column({ name: 'skill_id' })
  skillId!: string;

  @ManyToOne('Skill', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'skill_id' })
  skill!: Skill;
}
