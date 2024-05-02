import { SubmitResult, ValidateResult } from '../DialogForm';
import { DeliveryProjectFields } from '../../components/DeliveryProject/DeliveryProjectFormFields';
import { ValidationError } from '../ValidationError';

export function readValidationError(
  error: unknown,
): SubmitResult<DeliveryProjectFields> {
  if (error instanceof ValidationError) {
    return {
      type: 'validationError',
      errors: error.errors as ValidateResult<DeliveryProjectFields>,
    };
  }

  throw error;
}
