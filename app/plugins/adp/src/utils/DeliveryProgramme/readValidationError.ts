import { SubmitResult, ValidateResult } from '../DialogForm';
import { DeliveryProgrammeFields } from '../../components/DeliveryProgramme/DeliveryProgrammeFormFields';
import { ValidationError } from '../ValidationError';

export function readValidationError(
  error: unknown,
): SubmitResult<DeliveryProgrammeFields> {
  if (error instanceof ValidationError) {
    return {
      type: 'validationError',
      errors: error.errors as ValidateResult<DeliveryProgrammeFields>,
    };
  }

  throw error;
}
