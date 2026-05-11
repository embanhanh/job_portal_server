import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
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
import { UpdateUserDto } from './dto/update-user.dto';

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
    // Auth Hint cho Client (Non-HTTP-Only)
    res.cookie('has_session', 'true', {
      httpOnly: false,
      path: '/',
      sameSite: 'lax',
    });
  }

  // ── Helper: clear auth cookies ──────────────────────────────────────
  private clearAuthCookies(res: Response): void {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
    res.clearCookie('has_session', { path: '/' });
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
    return {
      accessToken: tokens.accessToken,
      message: 'common.auth.registerSuccess',
    };
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
    return {
      accessToken: tokens.accessToken,
      message: 'common.auth.loginSuccess',
    };
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
    try {
      const refreshToken = req.cookies['refresh_token'] as string | undefined;
      const tokens = await this.authService.refreshTokens(refreshToken, lang);
      this.setAuthCookies(res, tokens);
      return {
        accessToken: tokens.accessToken,
        message: 'common.auth.refreshSuccess',
      };
    } catch (error) {
      // Clear cookies if refresh fails (token invalid, expired, or mismatch)
      this.clearAuthCookies(res);
      throw error;
    }
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

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Update current authenticated user profile' })
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.authService.updateProfile(req.user.id, dto, file);
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
