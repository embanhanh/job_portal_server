import { Column, Entity, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';
import type { ITranslatableField } from '../../../common/interfaces/response.interface';

@Entity('categories')
export class Category extends BaseEntity {
  name!: ITranslatableField;

  @Column({ unique: true })
  slug!: string;

  description?: ITranslatableField;

  @Column({ name: 'parent_id', nullable: true })
  parentId?: string;

  @ManyToOne('Category', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parent_id' })
  parent?: Category;

  @OneToMany('Category', 'parent')
  children?: Category[];
}
