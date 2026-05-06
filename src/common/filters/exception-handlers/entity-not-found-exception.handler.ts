import { HttpStatus, Injectable } from '@nestjs/common';
import { EntityNotFoundError } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import type {
  ExceptionHandler,
  ExceptionResult,
} from './exception-handler.interface';

/**
 * Handles TypeORM EntityNotFoundError thrown when using findOneOrFail / findOneByOrFail.
 */
@Injectable()
export class EntityNotFoundExceptionHandler implements ExceptionHandler {
  constructor(private readonly i18n: I18nService) {}

  canHandle(exception: unknown): boolean {
    return exception instanceof EntityNotFoundError;
  }

  handle(_exception: unknown, lang: string): Promise<ExceptionResult> {
    const message = this.i18n.translate('common.errors.notFound', {
      lang,
    });
    return Promise.resolve({ statusCode: HttpStatus.NOT_FOUND, message });
  }
}
