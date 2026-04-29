import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    super({
      clientID: configService.get<string>('oauth.google.clientId') ?? '',
      clientSecret:
        configService.get<string>('oauth.google.clientSecret') ?? '',
      callbackURL: configService.get<string>('oauth.google.callbackUrl') ?? '',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    try {
      const tokens = await this.authService.validateOAuthUser({
        email: profile.emails?.[0]?.value ?? '',
        fullName: profile.displayName,
        avatar: profile.photos?.[0]?.value,
        googleId: profile.id,
      });
      done(null, tokens);
    } catch (error) {
      done(error as Error, undefined);
    }
  }
}
