import { z } from 'zod';
import { createBackendApiAction } from './createBackendApiAction';

export const registerFluxServiceAction = createBackendApiAction({
  id: 'adp:registerFluxService',
  method: 'POST',
  path: ({ teamName }) => `/FluxTeamConfig/${teamName}/services`,
  parametersSchema: z.object({
    teamName: z.string(),
  }),
});
