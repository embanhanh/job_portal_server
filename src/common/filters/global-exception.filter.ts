import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';

interface ExceptionResponseObject {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

interface HttpRequest {
  method: string;
  url: string;
  i18nLang?: string;
  headers?: Record<string, string | string[] | undefined>;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly i18n: I18nService) {}

  async catch(exception: unknown, host: ArgumentsHost): Promise<void> {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest<HttpRequest>();

    const lang = this.getLang(request);
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: string[] | undefined;

    // ── Handle HttpException ─────────────────────────────────────────
    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else {
        const res = exceptionResponse as ExceptionResponseObject;
        message = Array.isArray(res.message)
          ? res.message[0]
          : (res.message ?? exception.message);
        errors = Array.isArray(res.message) ? res.message : undefined;
      }

      // Translate known HTTP status errors
      if (statusCode === HttpStatus.UNAUTHORIZED) {
        message = await this.i18n.translate('common.errors.unauthorized', { lang });
      } else if (statusCode === HttpStatus.FORBIDDEN) {
        message = await this.i18n.translate('common.errors.forbidden', { lang });
      } else if (statusCode === HttpStatus.TOO_MANY_REQUESTS) {
        message = await this.i18n.translate('common.errors.tooManyRequests', { lang });
      }
    }
    // ── Handle TypeORM QueryFailedError ───────────────────────────────
    else if (exception instanceof QueryFailedError) {
      statusCode = HttpStatus.BAD_REQUEST;
      const driverError = exception.driverError as {
        code?: string;
        detail?: string;
      };

      if (driverError?.code === '23505') {
        message = await this.i18n.translate('common.errors.duplicate', { lang });
      } else {
        message = await this.i18n.translate('common.errors.database', { lang });
      }
    }
    // ── Handle TypeORM EntityNotFoundError ────────────────────────────
    else if (exception instanceof EntityNotFoundError) {
      statusCode = HttpStatus.NOT_FOUND;
      message = await this.i18n.translate('common.errors.notFound', { lang });
    }
    // ── Handle unknown errors ────────────────────────────────────────
    else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(
      `[${request.method}] ${request.url} → ${statusCode}: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  /**
   * Resolve language using nestjs-i18n's resolved lang (from query or header),
   * with fallback to Accept-Language header parsing.
   */
  private getLang(request: HttpRequest): string {
    // nestjs-i18n attaches i18nLang to the request
    if (request.i18nLang) {
      return request.i18nLang;
    }

    // Fallback: parse Accept-Language header
    const acceptLang = request.headers?.['accept-language'];
    if (typeof acceptLang === 'string') {
      return acceptLang.split(',')[0]?.trim() ?? 'en';
    }

    return 'en';
  }
}
