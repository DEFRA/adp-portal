import { SubmitResult, ValidateResult } from '../DialogForm';
import { AlbFields } from '../../components/ALB/AlbFormFields';
import { ValidationError } from '../ValidationError';

export function readValidationError(error: unknown): SubmitResult<AlbFields> {
  if (error instanceof ValidationError) {
    return {
      type: 'validationError',
      errors: error.errors as ValidateResult<AlbFields>,
    };
  }

  throw error;
}
