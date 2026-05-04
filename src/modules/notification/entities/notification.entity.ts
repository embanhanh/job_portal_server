import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';
import { NotificationType } from '../enums/notification-type.enum';
import { User } from 'src/modules/auth/entities/user.entity';

@Entity('notifications')
export class Notification extends BaseEntity {
  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'enum', enum: NotificationType })
  type!: NotificationType;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'is_read', default: false })
  isRead!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;
}
