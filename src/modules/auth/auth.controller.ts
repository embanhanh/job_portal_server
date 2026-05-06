import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { I18nLang, I18nService } from 'nestjs-i18n';
import { AuthService } from './auth.service';
import type { AuthTokens } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from './constants/cookie.constants';
import type { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly isProd: boolean;

  constructor(
    private readonly authService: AuthService,
    private readonly i18n: I18nService,
  ) {
    this.isProd = process.env.NODE_ENV === 'production';
  }

  // ── Helper: set auth cookies ────────────────────────────────────────
  private setAuthCookies(res: Response, tokens: AuthTokens): void {
    res.cookie(
      'access_token',
      tokens.accessToken,
      accessTokenCookieOptions(this.isProd),
    );
    res.cookie(
      'refresh_token',
      tokens.refreshToken,
      refreshTokenCookieOptions(this.isProd),
    );
  }

  // ── Helper: clear auth cookies ──────────────────────────────────────
  private clearAuthCookies(res: Response): void {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
  }

  // ── POST /auth/register ─────────────────────────────────────────────

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
    @I18nLang() lang: string,
  ) {
    const tokens = await this.authService.register(dto, lang);
    this.setAuthCookies(res, tokens);
    return { message: 'common.auth.registerSuccess' };
  }

  // ── POST /auth/login ────────────────────────────────────────────────

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @I18nLang() lang: string,
  ) {
    const tokens = await this.authService.login(dto, lang);
    this.setAuthCookies(res, tokens);
    return { message: 'common.auth.loginSuccess' };
  }

  // ── POST /auth/refresh ──────────────────────────────────────────────

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh authentication tokens using cookie' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @I18nLang() lang: string,
  ) {
    const refreshToken = req.cookies['refresh_token'] as string | undefined;

    if (!refreshToken) {
      throw new UnauthorizedException(
        this.i18n.translate('common.auth.noRefreshToken', { lang }),
      );
    }

    const tokens = await this.authService.refreshTokens(refreshToken, lang);
    this.setAuthCookies(res, tokens);
    return { message: 'common.auth.refreshSuccess' };
  }

  // ── POST /auth/logout ───────────────────────────────────────────────

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Logout and clear auth cookies' })
  async logout(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(req.user.id);
    this.clearAuthCookies(res);
    return { message: 'common.auth.logoutSuccess' };
  }

  // ── GET /auth/me ────────────────────────────────────────────────────

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  async me(@Req() req: AuthenticatedRequest, @I18nLang() lang: string) {
    return this.authService.me(req.user.id, lang);
  }

  // ── OAuth2: Google ─────────────────────────────────────────────────

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Login with Google OAuth2' })
  googleLogin(): void {
    // Passport redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth2 callback' })
  googleCallback(@Req() req: AuthenticatedRequest): AuthTokens {
    return req.user as unknown as AuthTokens;
  }

  // ── OAuth2: Facebook ──────────────────────────────────────────────

  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({ summary: 'Login with Facebook OAuth2' })
  facebookLogin(): void {
    // Passport redirects to Facebook
  }

  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({ summary: 'Facebook OAuth2 callback' })
  facebookCallback(@Req() req: AuthenticatedRequest): AuthTokens {
    return req.user as unknown as AuthTokens;
  }
}
