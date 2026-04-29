import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';
import { Role } from '../enums/role.enum';
import { AuthProvider } from '../enums/auth-provider.enum';
import { UserStatus } from '../enums/user-status.enum';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true })
  @Exclude()
  password?: string;

  @Column({ name: 'full_name' })
  fullName!: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ type: 'enum', enum: Role, default: Role.CANDIDATE })
  role!: Role;

  @Column({
    name: 'auth_provider',
    type: 'enum',
    enum: AuthProvider,
    default: AuthProvider.LOCAL,
  })
  authProvider!: AuthProvider;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @Column({ name: 'google_id', nullable: true })
  googleId?: string;

  @Column({ name: 'facebook_id', nullable: true })
  facebookId?: string;

  @Column({ name: 'refresh_token', nullable: true })
  @Exclude()
  refreshToken?: string;
}
