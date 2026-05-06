import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AuthService, JwtPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    super({
      // Dual extractor:
      // 1. HTTP-only cookie (production flow — browser tự gửi)
      // 2. Authorization: Bearer <token> fallback (Swagger / Postman testing)
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) =>
          (request?.cookies?.['access_token'] as string | undefined) ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') ?? 'default-secret',
    });
  }

  async validate(payload: JwtPayload) {
    this.logger.debug(`Validating JWT payload: ${JSON.stringify(payload)}`);
    const user = await this.authService.validateJwtPayload(payload);
    if (!user) {
      this.logger.warn(`JWT validation failed for payload: ${payload.sub}`);
      throw new UnauthorizedException('Invalid token');
    }
    this.logger.debug(
      `JWT validated successfully for user: ${user.email} (ID: ${user.id}, Role: ${user.role})`,
    );
    return user;
  }
}
