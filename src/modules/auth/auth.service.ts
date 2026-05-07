import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { I18nService } from 'nestjs-i18n';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User } from './entities/user.entity';
import { UserStatus } from './enums/user-status.enum';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from './enums/role.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export const AUTH_EVENTS = {
  USER_REGISTERED: 'auth.user_registered',
} as const;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly i18n: I18nService,
  ) {}

  async register(dto: RegisterDto, lang: string): Promise<AuthTokens> {
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException(
        this.i18n.translate('common.errors.duplicate', { lang }),
      );
    }

    const hashedPassword = await this.hashPassword(dto.password);

    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
      role: dto.role ?? Role.CANDIDATE,
    });

    const savedUser = await this.userRepository.save(user);

    // Emit event for Candidate/Company profile auto-creation
    this.eventEmitter.emit(AUTH_EVENTS.USER_REGISTERED, savedUser);

    const tokens = await this.generateTokens(savedUser);
    await this.updateRefreshToken(savedUser.id, tokens.refreshToken);

    return tokens;
  }

  async login(dto: LoginDto, lang: string): Promise<AuthTokens> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException(
        this.i18n.translate('common.auth.invalidCredentials', { lang }),
      );
    }

    const isPasswordValid = await this.verifyPassword(
      dto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        this.i18n.translate('common.auth.invalidCredentials', { lang }),
      );
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async validateOAuthUser(profile: {
    email: string;
    fullName: string;
    avatar?: string;
    googleId?: string;
    facebookId?: string;
  }): Promise<AuthTokens> {
    let user = await this.userRepository.findOne({
      where: { email: profile.email },
    });

    let isNewUser = false;

    if (!user) {
      user = this.userRepository.create({
        email: profile.email,
        fullName: profile.fullName,
        avatar: profile.avatar,
        googleId: profile.googleId,
        facebookId: profile.facebookId,
        role: Role.CANDIDATE,
      });
      user = await this.userRepository.save(user);
      isNewUser = true;
    } else {
      if (profile.googleId && !user.googleId) user.googleId = profile.googleId;
      if (profile.facebookId && !user.facebookId)
        user.facebookId = profile.facebookId;
      user = await this.userRepository.save(user);
    }

    if (isNewUser) {
      this.eventEmitter.emit(AUTH_EVENTS.USER_REGISTERED, user);
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async validateJwtPayload(payload: JwtPayload): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: payload.sub } });
  }

  async me(userId: string, lang: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException(
        this.i18n.translate('common.auth.userNotFound', { lang }),
      );
    }
    return user;
  }

  async logout(userId: string): Promise<void> {
    await this.userRepository.update(userId, { refreshToken: null });
  }

  async refreshTokens(
    refreshToken: string | undefined,
    lang: string,
  ): Promise<AuthTokens> {
    if (!refreshToken) {
      throw new UnauthorizedException(
        this.i18n.translate('common.auth.noRefreshToken', { lang }),
      );
    }
    try {
      const payload: JwtPayload = await this.jwtService.verifyAsync(
        refreshToken,
        {
          secret: this.configService.get<string>('jwt.refreshSecret'),
        },
      );

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException(
          this.i18n.translate('common.auth.tokenExpired', { lang }),
        );
      }

      const hashedToken = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      if (user.refreshToken !== hashedToken) {
        throw new UnauthorizedException(
          this.i18n.translate('common.auth.tokenExpired', { lang }),
        );
      }

      const tokens = await this.generateTokens(user);
      await this.updateRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch (e) {
      if (e instanceof UnauthorizedException) throw e;
      throw new UnauthorizedException(
        this.i18n.translate('common.auth.tokenExpired', { lang }),
      );
    }
  }

  async updateUserStatus(id: string, status: UserStatus): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    user.status = status;
    return this.userRepository.save(user);
  }

  async updateUserRole(id: string, role: Role): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    user.role = role;
    return this.userRepository.save(user);
  }

  // ── Private Helpers ────────────────────────────────────────────────

  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: 2592000, // 30 days in seconds
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hashed = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    await this.userRepository.update(userId, { refreshToken: hashed });
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  private async verifyPassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
