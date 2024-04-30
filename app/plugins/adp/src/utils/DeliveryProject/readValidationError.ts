import { ResponseError } from '@backstage/errors';
import { SubmitResult } from '../DialogForm';
import { DeliveryProjectFields } from '../../components/DeliveryProject/DeliveryProjectFormFields';

export function readValidationError(
  error: unknown,
  fields: DeliveryProjectFields,
): SubmitResult<DeliveryProjectFields> {
  if (error instanceof ResponseError && error.response.status === 406) {
    // TODO: duplicate title
    // TODO: duplicate delivery_project_code
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
