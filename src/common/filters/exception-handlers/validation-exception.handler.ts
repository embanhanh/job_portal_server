import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import type {
  ExceptionHandler,
  ExceptionResult,
} from './exception-handler.interface';
import type { I18nValidationError } from '../../pipes/i18n-validation.pipe';

interface ValidationExceptionBody {
  isValidationError: true;
  errors: I18nValidationError[];
}

function isValidationExceptionBody(
  body: unknown,
): body is ValidationExceptionBody {
  return (
    typeof body === 'object' &&
    body !== null &&
    'isValidationError' in body &&
    (body as Record<string, unknown>)['isValidationError'] === true &&
    'errors' in body &&
    Array.isArray((body as Record<string, unknown>)['errors'])
  );
}

/**
 * Handles UnprocessableEntityException thrown by I18nValidationPipe.
 * Translates each field constraint into the user's language and returns
 * a structured errors map: { fieldName: string[] }.
 */
@Injectable()
export class ValidationExceptionHandler implements ExceptionHandler {
  constructor(private readonly i18n: I18nService) {}

  canHandle(exception: unknown): boolean {
    if (!(exception instanceof UnprocessableEntityException)) return false;
    const body = exception.getResponse();
    return isValidationExceptionBody(body);
  }

  handle(exception: unknown, lang: string): Promise<ExceptionResult> {
    const httpEx = exception as UnprocessableEntityException;
    const body = httpEx.getResponse() as ValidationExceptionBody;

    const message = String(
      this.i18n.translate('common.errors.validation', {
        lang,
      }),
    );
    const errors: Record<string, string[]> = {};

    for (const validationError of body.errors) {
      const messages: string[] = [];

      for (const [constraintKey, i18nKey] of Object.entries(
        validationError.constraints,
      )) {
        const args = validationError.contexts?.[constraintKey] ?? {};
        console.log('ARGS:', args, 'CONTEXTS:', validationError.contexts);
        const translated = String(
          this.i18n.translate(i18nKey, {
            lang,
            args: { field: validationError.field, ...args },
          }),
        );
        messages.push(translated);
      }

      errors[validationError.field] = messages;
    }

    return Promise.resolve({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message,
      errors,
    });
  }
}
