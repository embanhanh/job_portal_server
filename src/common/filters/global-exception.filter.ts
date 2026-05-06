import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Inject,
  Logger,
} from '@nestjs/common';
import type {
  ExceptionHandler,
  ExceptionResult,
} from './exception-handlers/exception-handler.interface';
import { EXCEPTION_HANDLERS } from './exception-handlers/exception-handler.interface';

interface HttpRequest {
  method: string;
  url: string;
  i18nLang?: string;
  headers?: Record<string, string | string[] | undefined>;
}

interface HttpResponse {
  status(code: number): this;
  json(body: unknown): this;
}

/**
 * Global exception filter that delegates exception handling to registered handlers.
 *
 * Architecture (OCP):
 *   - Handlers are injected via EXCEPTION_HANDLERS token (array ordered by priority).
 *   - First handler where canHandle() returns true is used.
 *   - FallbackExceptionHandler is always last.
 *
 * Async safety:
 *   - catch() is synchronous to comply with NestJS expectations.
 *   - Async logic is in handleException(), errors there are caught and logged.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(
    @Inject(EXCEPTION_HANDLERS)
    private readonly handlers: ExceptionHandler[],
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    this.handleException(exception, host).catch((err: unknown) => {
      this.logger.error('GlobalExceptionFilter itself threw an error:', err);
    });
  }

  private async handleException(
    exception: unknown,
    host: ArgumentsHost,
  ): Promise<void> {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<HttpResponse>();
    const request = ctx.getRequest<HttpRequest>();

    const lang = this.getLang(request);

    // Find the first handler that can process this exception
    const handler = this.handlers.find((h) => h.canHandle(exception));

    let result: ExceptionResult;

    if (handler) {
      result = await handler.handle(exception, lang);
    } else {
      // Ultimate fallback if no handler matches (e.g. non-Error thrown)
      this.logger.error(
        'Unhandled exception with no matching handler:',
        exception,
      );
      result = {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An internal server error occurred',
      };
    }

    this.logger.error(
      `[${request.method}] ${request.url} → ${result.statusCode}: ${result.message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(result.statusCode).json({
      success: false,
      statusCode: result.statusCode,
      message: result.message,
      errors: result.errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  /**
   * Resolves the request language with locale tag normalization.
   * - Uses nestjs-i18n's resolved lang if available (i18nLang).
   * - Falls back to Accept-Language header, normalizing "vi-VN" → "vi".
   * - Defaults to "en".
   */
  private getLang(request: HttpRequest): string {
    if (request.i18nLang) return request.i18nLang;

    const acceptLang = request.headers?.['accept-language'];
    if (typeof acceptLang === 'string') {
      const primaryTag = acceptLang.split(',')[0]?.trim();
      return primaryTag?.split('-')[0] ?? 'en'; // "vi-VN" → "vi"
    }

    return 'en';
  }
}
