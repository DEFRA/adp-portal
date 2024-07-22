import { type ValidationErrorMapping } from '@internal/plugin-adp-common';

export const errorMapping = {
  duplicateName: (req: { title?: string }) => ({
    path: 'title',
    error: {
      message: `The name '${req.title}' is already in use. Please choose a different name.`,
    },
  }),
  duplicateTitle: (req: { title?: string }) => ({
    path: 'title',
    error: {
      message: `The name '${req.title}' is already in use. Please choose a different name.`,
    },
  }),
  duplicateProgrammeCode: () => ({
    path: 'delivery_programme_code',
    error: {
      message: `The programme code is already in use by another delivery programme.`,
    },
  }),
  unknownArmsLengthBody: () => ({
    path: 'arms_length_body_id',
    error: {
      message: `The arms length body does not exist.`,
    },
  }),
  unknown: () => ({
    path: 'root',
    error: {
      message: `An unexpected error occurred.`,
    },
  }),
} as const satisfies ValidationErrorMapping;
