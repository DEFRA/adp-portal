import { createEndpointRef } from '../util';
import { deliveryProjectGithubTeamsSyncronizerRef } from '../../githubTeam';
import { deliveryProjectStoreRef } from '../../deliveryProject';
import { type UpdateDeliveryProjectRequest } from '@internal/plugin-adp-common';
import { z } from 'zod';
import { createParser } from '../../utils';
import { fireAndForgetCatalogRefresherRef } from '../../services';
import { errorMapping } from './errorMapping';
import { identityProviderRef } from '@internal/plugin-credentials-context-backend';

export default createEndpointRef({
  deps: {
    identity: identityProviderRef,
    deliveryProjectStore: deliveryProjectStoreRef,
    teamSyncronizer: deliveryProjectGithubTeamsSyncronizerRef,
    catalogRefresher: fireAndForgetCatalogRefresherRef,
  },
  factory({
    deps: { identity, deliveryProjectStore, teamSyncronizer, catalogRefresher },
    responses: { ok, validationErrors },
  }) {
    const parseBody = createParser<UpdateDeliveryProjectRequest>(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        alias: z.string().optional(),
        description: z.string().optional(),
        finance_code: z.string().optional(),
        delivery_programme_id: z.string().optional(),
        delivery_project_code: z.string().optional(),
        ado_project: z.string().optional(),
        team_type: z.string().optional(),
        service_owner: z.string().optional(),
        github_team_visibility: z.enum(['public', 'private']).optional(),
      }),
    );

    return async request => {
      const body = parseBody(request.body);
      const { userEntityRef } = await identity.getCurrentIdentity();
      const result = await deliveryProjectStore.update(body, userEntityRef);
      if (!result.success)
        return validationErrors(result.errors, errorMapping, body);

      await Promise.allSettled([
        teamSyncronizer.syncronizeByName(result.value.name),
      ]);
      await catalogRefresher.refresh(`location:default/delivery-programmes`);
      return ok().json(result.value);
    };
  },
});
