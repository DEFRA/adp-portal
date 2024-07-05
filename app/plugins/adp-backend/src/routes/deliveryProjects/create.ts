import { createEndpointRef } from '../util';
import { deliveryProjectGithubTeamsSyncronizerRef } from '../../githubTeam';
import {
  deliveryProjectStoreRef,
  fluxConfigApiRef,
} from '../../deliveryProject';
import { type CreateDeliveryProjectRequest } from '@internal/plugin-adp-common';
import { z } from 'zod';
import { createParser } from '../../utils';
import { fireAndForgetCatalogRefresherRef } from '../../services';
import { errorMapping } from './errorMapping';
import { identityProviderRef } from '@internal/plugin-credentials-context-backend';

export default createEndpointRef({
  name: 'createDeliveryProject',
  deps: {
    identity: identityProviderRef,
    deliveryProjectStore: deliveryProjectStoreRef,
    fluxConfigApi: fluxConfigApiRef,
    teamSyncronizer: deliveryProjectGithubTeamsSyncronizerRef,
    catalogRefresher: fireAndForgetCatalogRefresherRef,
  },
  factory({
    deps: {
      identity,
      deliveryProjectStore,
      fluxConfigApi,
      teamSyncronizer,
      catalogRefresher,
    },
    responses: { created, validationErrors },
  }) {
    const parseBody = createParser<CreateDeliveryProjectRequest>(
      z.object({
        title: z.string(),
        alias: z.string().optional(),
        description: z.string(),
        finance_code: z.string().optional(),
        delivery_programme_id: z.string(),
        delivery_project_code: z.string(),
        ado_project: z.string(),
        team_type: z.string(),
        service_owner: z.string(),
        github_team_visibility: z.enum(['public', 'private']),
      }),
    );

    return async request => {
      const body = parseBody(request.body);
      const { userEntityRef } = await identity.getCurrentIdentity();
      const result = await deliveryProjectStore.add(body, userEntityRef);
      if (!result.success)
        return validationErrors(result.errors, errorMapping, body);

      await Promise.allSettled([
        fluxConfigApi.createFluxConfig(result.value),
        teamSyncronizer.syncronizeByName(result.value.name),
      ]);
      await catalogRefresher.refresh(`location:default/delivery-programmes`);
      return created().json(result.value);
    };
  },
});
