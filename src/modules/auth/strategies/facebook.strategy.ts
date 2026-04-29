import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import type { AuthTokens } from '../auth.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    super({
      clientID: configService.get<string>('oauth.facebook.appId') ?? '',
      clientSecret: configService.get<string>('oauth.facebook.appSecret') ?? '',
      callbackURL:
        configService.get<string>('oauth.facebook.callbackUrl') ?? '',
      profileFields: ['id', 'emails', 'name', 'photos'],
      scope: ['email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (err: Error | null, user?: AuthTokens) => void,
  ): Promise<void> {
    try {
      const tokens = await this.authService.validateOAuthUser({
        email: profile.emails?.[0]?.value ?? '',
        fullName:
          `${profile.name?.givenName ?? ''} ${profile.name?.familyName ?? ''}`.trim(),
        avatar: profile.photos?.[0]?.value,
        facebookId: profile.id,
      });
      done(null, tokens);
    } catch (error) {
      done(error as Error, undefined);
    }
  }
}
