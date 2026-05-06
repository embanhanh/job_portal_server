import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import type {
  ExceptionHandler,
  ExceptionResult,
} from './exception-handler.interface';

interface ExceptionResponseObject {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

/**
 * Map of HTTP status codes that have dedicated i18n messages.
 * If a status is not in this map, the original exception message is used as fallback.
 */
const HTTP_STATUS_I18N_KEYS: Partial<Record<HttpStatus, string>> = {
  [HttpStatus.UNAUTHORIZED]: 'common.errors.unauthorized',
  [HttpStatus.FORBIDDEN]: 'common.errors.forbidden',
  [HttpStatus.TOO_MANY_REQUESTS]: 'common.errors.tooManyRequests',
  [HttpStatus.NOT_FOUND]: 'common.errors.notFound',
};

@Injectable()
export class HttpExceptionHandler implements ExceptionHandler {
  constructor(private readonly i18n: I18nService) {}

  canHandle(exception: unknown): boolean {
    return exception instanceof HttpException;
  }

  handle(exception: unknown, lang: string): Promise<ExceptionResult> {
    const httpEx = exception as HttpException;
    const statusCode = httpEx.getStatus();
    const exceptionResponse = httpEx.getResponse();

    let message: string;
    let errors: string[] | undefined;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else {
      const res = exceptionResponse as ExceptionResponseObject;
      message = Array.isArray(res.message)
        ? (res.message[0] ?? httpEx.message)
        : (res.message ?? httpEx.message);
      errors = Array.isArray(res.message) ? res.message : undefined;
    }

    // Translate known HTTP status codes
    const translatedMessage = this.resolveHttpMessage(
      statusCode,
      message,
      lang,
    );

    return Promise.resolve({ statusCode, message: translatedMessage, errors });
  }

  /**
   * Returns the i18n translation for well-known HTTP statuses,
   * or falls back to the original message from the exception.
   */
  private resolveHttpMessage(
    statusCode: HttpStatus,
    fallback: string,
    lang: string,
  ): string {
    const key = HTTP_STATUS_I18N_KEYS[statusCode];
    if (!key) return fallback;
    return this.i18n.translate(key, { lang });
  }
}
