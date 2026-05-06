/**
 * Result returned by any ExceptionHandler.
 */
export interface ExceptionResult {
  statusCode: number;
  message: string;
  errors?: string[] | Record<string, string[]>;
}

/**
 * Contract for all exception handlers used by GlobalExceptionFilter.
 * Implement this interface and register the handler in AppModule to support
 * new exception types without modifying the filter itself (OCP).
 */
export interface ExceptionHandler {
  /**
   * Returns true if this handler can process the given exception.
   * Handlers are evaluated in registration order — first match wins.
   */
  canHandle(exception: unknown): boolean;

  /**
   * Process the exception and return a structured result.
   * @param exception The exception to handle
   * @param lang The resolved language tag (e.g. "vi", "en")
   */
  handle(exception: unknown, lang: string): Promise<ExceptionResult>;
}

/** Injection token for the handlers array */
export const EXCEPTION_HANDLERS = 'EXCEPTION_HANDLERS';
