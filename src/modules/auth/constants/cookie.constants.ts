import type { CookieOptions } from 'express';

/**
 * Access token cookie — HTTP-only, hết hạn sau 15 phút.
 * Gửi kèm mọi request nhờ path '/'.
 */
export const accessTokenCookieOptions = (isProd: boolean): CookieOptions => ({
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax',
  maxAge: 15 * 60 * 1000, // 15 phút (ms)
  path: '/',
});

/**
 * Refresh token cookie — HTTP-only, hết hạn sau 30 ngày.
 * Gửi kèm mọi request (path '/') để interceptor có thể refresh.
 */
export const refreshTokenCookieOptions = (isProd: boolean): CookieOptions => ({
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 ngày (ms)
  path: '/',
});
