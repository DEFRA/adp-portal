import type { SubmitResult, ValidateResult } from './DialogForm';
import { ValidationError } from './ValidationError';
import type { FieldValues } from 'react-hook-form';

export function readValidationError<TFields extends FieldValues>(
  error: unknown,
): SubmitResult<TFields> {
  if (error instanceof ValidationError) {
    return {
      type: 'validationError',
      errors: error.errors as ValidateResult<TFields>,
    };
  }

  throw error;
}
