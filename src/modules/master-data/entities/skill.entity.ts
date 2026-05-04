import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';
import type { ITranslatableField } from '../../../common/interfaces/response.interface';

@Entity('skills')
export class Skill extends BaseEntity {
  name!: ITranslatableField;

  @Column({ unique: true })
  slug!: string;

  @Column({ nullable: true })
  category?: string;
}
