import { z } from 'zod';
import { createBackendApiAction } from './createBackendApiAction';

export const configureAdoProjectAction = createBackendApiAction({
  id: 'adp:configureAdoProject',
  method: 'PATCH',
  path: ({ adoProject }) => `/AdoProject/${adoProject}/onboard`,
  parametersSchema: z.object({
    adoProject: z.string(),
  }),
});
