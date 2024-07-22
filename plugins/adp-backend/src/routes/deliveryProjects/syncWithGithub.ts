import { createEndpointRef } from '../util';
import { deliveryProjectGithubTeamsSyncronizerRef } from '../../githubTeam';
import { type Request } from 'express';

export default createEndpointRef({
  name: 'syncDeliveryProjectTeamsWithGithub',
  deps: {
    teamSyncronizer: deliveryProjectGithubTeamsSyncronizerRef,
  },
  factory({ deps: { teamSyncronizer }, responses: { ok } }) {
    return async (request: Request<{ projectName: string }>) => {
      const result = await teamSyncronizer.syncronizeByName(
        request.params.projectName,
      );
      return ok().json(result);
    };
  },
});
