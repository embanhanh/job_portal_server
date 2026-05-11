import { Column, Entity, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';
import type { ITranslatableField } from '../../../common/interfaces/response.interface';

@Entity('locations')
export class Location extends BaseEntity {
  @Column({ type: 'jsonb', nullable: true })
  name!: ITranslatableField;

  @Column({ unique: true })
  slug!: string;

  @Column({ name: 'parent_id', nullable: true })
  parentId?: string;

  @ManyToOne('Location', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parent_id' })
  parent?: Location;

  @OneToMany('Location', 'parent')
  children?: Location[];
}
