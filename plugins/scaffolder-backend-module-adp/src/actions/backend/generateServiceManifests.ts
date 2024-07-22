import { z } from 'zod';
import { createBackendApiAction } from './createBackendApiAction';

export const generateServiceManifestsAction = createBackendApiAction({
  id: 'adp:generateServiceManifests',
  method: 'POST',
  path: ({ teamName, serviceName }) =>
    `/FluxTeamConfig/${teamName}/generate?serviceName=${serviceName}`,
  parametersSchema: z.object({
    teamName: z.string(),
    serviceName: z.string(),
  }),
});
