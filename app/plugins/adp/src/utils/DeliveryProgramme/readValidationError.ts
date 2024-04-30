import { ResponseError } from '@backstage/errors';
import { SubmitResult } from '../DialogForm';
import { DeliveryProgrammeFields } from '../../components/DeliveryProgramme/DeliveryProgrammeFormFields';

export function readValidationError(
  error: unknown,
  fields: DeliveryProgrammeFields,
): SubmitResult<DeliveryProgrammeFields> {
  if (error instanceof ResponseError && error.response.status === 406) {
    // TODO: duplicate title
    // TODO: duplicate delivery_programme_code
    return {
      type: 'validationError',
      errors: [
        {
          name: 'title',
          error: {
            message: `The name '${fields.title}' is already in use. Please choose a different name.`,
          },
        },
      ],
    };
  }

  throw error;
}
