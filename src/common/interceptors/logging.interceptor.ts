import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClsService } from 'nestjs-cls';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import type { Request, Response } from 'express';
import { throwError } from 'rxjs';
import * as crypto from 'crypto';

import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

/**
 * Global HTTP Request/Response Logger.
 *
 * Logs the full lifecycle of each HTTP request:
 * - [REQ] on entry: method, url, userId (if authenticated), requestId
 * - [RES] on exit: method, url, statusCode, duration (ms), requestId
 * - [SLOW] warning if response exceeds the configured threshold
 *
 * Also stores a unique `requestId` (UUID) in the CLS context so it can be
 * correlated across service/repository log lines within the same request.
 *
 * Registration: app.module.ts as APP_INTERCEPTOR (before ResponseInterceptor)
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  constructor(
    private readonly configService: ConfigService,
    private readonly cls: ClsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpCtx = context.switchToHttp();
    const request = httpCtx.getRequest<AuthenticatedRequest>();
    const response = httpCtx.getResponse<Response>();

    // Get requestId from CLS context (set in AppModule middleware)
    // Fallback to generating one if for some reason it's missing
    const requestId = this.cls.get<string>('requestId') || crypto.randomUUID();
    if (!this.cls.get('requestId')) {
      this.cls.set('requestId', requestId);
    }

    const { method, url } = request;
    const userId = request.user?.id ?? 'anonymous';
    const startTime = Date.now();
    const slowThreshold = this.configService.get<number>(
      'app.slowRequestThresholdMs',
      3000,
    );

    this.logger.log(
      `[REQ] ${method} ${url} | userId=${userId} | requestId=${requestId}`,
    );

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        if (duration >= slowThreshold) {
          this.logger.warn(
            `[SLOW] ${method} ${url} → ${statusCode} | ${duration}ms | requestId=${requestId}`,
          );
        } else {
          this.logger.log(
            `[RES] ${method} ${url} → ${statusCode} | ${duration}ms | requestId=${requestId}`,
          );
        }
      }),
      catchError((err: unknown) => {
        const duration = Date.now() - startTime;
        this.logger.error(
          `[ERR] ${method} ${url} | ${duration}ms | requestId=${requestId}`,
          err instanceof Error ? err.stack : String(err),
        );
        return throwError(() => err);
      }),
    );
  }
}
