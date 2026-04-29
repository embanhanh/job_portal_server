import { Column, Entity, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';

@Entity('candidates')
export class Candidate extends BaseEntity {
  @Column({ name: 'user_id', unique: true })
  userId!: string;

  @OneToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: import('../../auth/entities/user.entity').User;

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
  educations?: import('./education.entity').Education[];

  @OneToMany('Experience', 'candidate')
  experiences?: import('./experience.entity').Experience[];

  @OneToMany('CandidateSkill', 'candidate')
  candidateSkills?: import('./candidate-skill.entity').CandidateSkill[];
}
