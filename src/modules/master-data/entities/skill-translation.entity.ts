import { Column, Entity, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';
import { Skill } from './skill.entity';

@Entity('skill_translations')
@Index(['skillId', 'language'], { unique: true })
export class SkillTranslation extends BaseEntity {
  @Column({ name: 'skill_id' })
  skillId!: string;

  @ManyToOne(() => Skill, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'skill_id' })
  skill!: Skill;

  @Column()
  language!: string;

  @Column({ type: 'text' })
  name!: string;
}
