import { Column, Entity, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';
import { Category } from './category.entity';

@Entity('category_translations')
@Index(['categoryId', 'language'], { unique: true })
export class CategoryTranslation extends BaseEntity {
  @Column({ name: 'category_id' })
  categoryId!: string;

  @ManyToOne(() => Category, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  @Column()
  language!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;
}
