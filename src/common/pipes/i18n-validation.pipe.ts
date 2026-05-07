import {
  Injectable,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common';
import { getMetadataStorage, type ValidationError } from 'class-validator';

/**
 * Structured validation error for a single field.
 * Supports nested fields (e.g. "address.city").
 */
export interface I18nValidationError {
  /** Field path — supports nested: "address.city" */
  field: string;
  /** Map of constraint key → i18n key (e.g. isEnum → "validation.isEnum") */
  constraints: Record<string, string>;
  /** Map of constraint key → args for i18n interpolation (e.g. { min: 8 }) */
  contexts: Record<string, Record<string, unknown>>;
}

/**
 * Maps a class-validator constraint key to the corresponding i18n key.
 * Keys not in this map fall back to "validation.<constraintKey>".
 */
const CONSTRAINT_TO_I18N_KEY: Record<string, string> = {
  isEnum: 'validation.isEnum',
  isNotEmpty: 'validation.isNotEmpty',
  minLength: 'validation.minLength',
  maxLength: 'validation.maxLength',
  isEmail: 'validation.isEmail',
  isString: 'validation.isString',
  isNumber: 'validation.isNumber',
  isBoolean: 'validation.isBoolean',
  isInt: 'validation.isInt',
  isPositive: 'validation.isPositive',
  isArray: 'validation.isArray',
  isDate: 'validation.isDate',
  isUrl: 'validation.isUrl',
  isUUID: 'validation.isUUID',
  isStrongPassword: 'validation.isStrongPassword',
  matches: 'validation.matches',
};

function resolveI18nKey(constraintKey: string): string {
  return CONSTRAINT_TO_I18N_KEY[constraintKey] ?? `validation.${constraintKey}`;
}

/**
 * Recursively flattens class-validator ValidationError[] into I18nValidationError[].
 * Supports nested DTOs by joining parent and child property paths with a dot.
 */
function flattenValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): I18nValidationError[] {
  const result: I18nValidationError[] = [];
  const metadataStorage = getMetadataStorage();

  for (const error of errors) {
    const field = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;

    // Process nested children first
    if (error.children && error.children.length > 0) {
      result.push(...flattenValidationErrors(error.children, field));
    }

    // Process own constraints
    if (error.constraints && Object.keys(error.constraints).length > 0) {
      const constraints: Record<string, string> = {};
      const contexts: Record<string, Record<string, unknown>> = {};

      const targetMeta = error.target
        ? metadataStorage.getTargetValidationMetadatas(
            error.target.constructor,
            '',
            true,
            false,
          )
        : [];
      const propertyMetas = targetMeta.filter(
        (m) => m.propertyName === error.property,
      );

      for (const constraintKey of Object.keys(error.constraints)) {
        constraints[constraintKey] = resolveI18nKey(constraintKey);

        // Extract args from contexts if provided by the decorator
        const rawCtx: unknown = error.contexts?.[constraintKey];
        const ctx: Record<string, unknown> =
          rawCtx && typeof rawCtx === 'object'
            ? (rawCtx as Record<string, unknown>)
            : {};

        const meta = propertyMetas.find(
          (m) => m.name === constraintKey || m.type === constraintKey,
        );
        if (meta?.constraints?.length) {
          if (constraintKey === 'minLength') {
            ctx.min = meta.constraints[0];
          } else if (constraintKey === 'maxLength') {
            ctx.max = meta.constraints[0];
          } else if (constraintKey === 'isEnum') {
            const enumObj = meta.constraints[0] as unknown;
            if (enumObj && typeof enumObj === 'object') {
              ctx.values = Object.values(
                enumObj as Record<string, unknown>,
              ).join(', ');
            } else if (Array.isArray(enumObj)) {
              ctx.values = enumObj.join(', ');
            }
          } else if (constraintKey === 'matches') {
            ctx.regex = meta.constraints[0];
          }
        }

        if (Object.keys(ctx).length > 0) {
          contexts[constraintKey] = ctx;
        }
      }

      result.push({ field, constraints, contexts });
    }
  }

  return result;
}

/**
 * Extends the default ValidationPipe to produce i18n-aware, per-field structured
 * validation errors via UnprocessableEntityException (HTTP 422).
 *
 * The exception body contains:
 *   { isValidationError: true, errors: I18nValidationError[] }
 *
 * This flag is detected by ValidationExceptionHandler inside GlobalExceptionFilter.
 *
 * Usage (main.ts):
 *   app.useGlobalPipes(new I18nValidationPipe());
 */
@Injectable()
export class I18nValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      validationError: { target: true, value: true },
      stopAtFirstError: false,
      exceptionFactory: (errors: ValidationError[]) => {
        const structured = flattenValidationErrors(errors);
        return new UnprocessableEntityException({
          isValidationError: true,
          errors: structured,
        });
      },
    });
  }
}
