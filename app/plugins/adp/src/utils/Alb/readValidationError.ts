import { ResponseError } from '@backstage/errors';
import { SubmitResult } from '../DialogForm';
import { AlbFields } from '../../components/ALB/AlbFormFields';

export function readValidationError(
  error: unknown,
  fields: AlbFields,
): SubmitResult<AlbFields> {
  if (error instanceof ResponseError && error.response.status === 406) {
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
