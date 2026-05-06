import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import type {
  ExceptionHandler,
  ExceptionResult,
} from './exception-handler.interface';

/**
 * Fallback handler — catches any remaining Error instances.
 *
 * SECURITY: The original error message is NEVER sent to the client.
 * Only a generic i18n message is returned.
 * The full message and stack are logged server-side only.
 */
@Injectable()
export class FallbackExceptionHandler implements ExceptionHandler {
  private readonly logger = new Logger(FallbackExceptionHandler.name);

  constructor(private readonly i18n: I18nService) {}

  canHandle(exception: unknown): boolean {
    return exception instanceof Error;
  }

  handle(exception: unknown, lang: string): Promise<ExceptionResult> {
    // Log full details server-side — never expose to client
    if (exception instanceof Error) {
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
      );
    }

    const message = this.i18n.translate('common.errors.internalServer', {
      lang,
    });
    return Promise.resolve({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message,
    });
  }
}
