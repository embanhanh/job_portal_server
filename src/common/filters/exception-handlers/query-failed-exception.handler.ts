import { HttpStatus, Injectable } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import type {
  ExceptionHandler,
  ExceptionResult,
} from './exception-handler.interface';
import { POSTGRES_ERROR_CODES } from '../../constants/postgres-error-codes.constant';

/**
 * Type guard for PostgreSQL driver errors.
 * Replaces unsafe `as { code?: string; detail?: string }` cast.
 */
function isPostgresError(
  err: unknown,
): err is { code: string; detail?: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as Record<string, unknown>)['code'] === 'string'
  );
}

/**
 * Handles TypeORM QueryFailedError (e.g. unique constraint, FK violation).
 * Uses named constants instead of magic strings for PG error codes.
 */
@Injectable()
export class QueryFailedExceptionHandler implements ExceptionHandler {
  constructor(private readonly i18n: I18nService) {}

  canHandle(exception: unknown): boolean {
    return exception instanceof QueryFailedError;
  }

  handle(exception: unknown, lang: string): Promise<ExceptionResult> {
    const queryError = exception as QueryFailedError;
    const driverError: unknown = queryError.driverError;

    if (
      isPostgresError(driverError) &&
      driverError.code === POSTGRES_ERROR_CODES.UNIQUE_VIOLATION
    ) {
      const message = this.i18n.translate('common.errors.duplicate', {
        lang,
      });
      return Promise.resolve({ statusCode: HttpStatus.CONFLICT, message });
    }

    const message = this.i18n.translate('common.errors.database', {
      lang,
    });
    return Promise.resolve({ statusCode: HttpStatus.BAD_REQUEST, message });
  }
}
