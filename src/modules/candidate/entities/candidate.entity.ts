import { Column, Entity, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';
import { User } from 'src/modules/auth/entities/user.entity';
import { Education } from './education.entity';
import { Experience } from './experience.entity';
import { CandidateSkill } from './candidate-skill.entity';

@Entity('candidates')
export class Candidate extends BaseEntity {
  @Column({ name: 'user_id', unique: true })
  userId!: string;

  @OneToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'full_name', nullable: true })
  fullName?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  @Column({ type: 'jsonb', nullable: true })
  bio?: Record<string, string>;

  @Column({ name: 'current_cv_url', nullable: true })
  currentCvUrl?: string;

  @Column({ name: 'is_searching', default: false })
  isSearching!: boolean;

  @OneToMany('Education', 'candidate')
  educations?: Education[];

  @OneToMany('Experience', 'candidate')
  experiences?: Experience[];

  @OneToMany('CandidateSkill', 'candidate')
  candidateSkills?: CandidateSkill[];
}
