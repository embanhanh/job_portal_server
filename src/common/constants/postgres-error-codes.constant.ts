/**
 * PostgreSQL error codes for structured error handling.
 * @see https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
export const POSTGRES_ERROR_CODES = {
  /** Unique constraint violation — duplicate key value */
  UNIQUE_VIOLATION: '23505',
  /** Foreign key constraint violation */
  FOREIGN_KEY_VIOLATION: '23503',
  /** NOT NULL constraint violation */
  NOT_NULL_VIOLATION: '23502',
  /** CHECK constraint violation */
  CHECK_VIOLATION: '23514',
} as const;
