import { deliveryProjectUserStoreRef } from '../../deliveryProjectUser';
import { createParser } from '../../utils';
import { type DeleteDeliveryProjectUserRequest } from '@internal/plugin-adp-common';
import { z } from 'zod';
import { deliveryProjectGithubTeamsSyncronizerRef } from '../../githubTeam';
import { deliveryProjectEntraIdGroupsSyncronizerRef } from '../../entraId';
import { createEndpointRef } from '../util';
import { fireAndForgetCatalogRefresherRef } from '../../services';

export default createEndpointRef({
  deps: {
    deliveryProjectUserStore: deliveryProjectUserStoreRef,
    teamSyncronizer: deliveryProjectGithubTeamsSyncronizerRef,
    catalogRefresher: fireAndForgetCatalogRefresherRef,
    entraIdGroupSyncronizer: deliveryProjectEntraIdGroupsSyncronizerRef,
  },
  factory({
    deps: {
      deliveryProjectUserStore,
      teamSyncronizer,
      catalogRefresher,
      entraIdGroupSyncronizer,
    },
    responses: { noContent },
  }) {
    const parseBody = createParser<DeleteDeliveryProjectUserRequest>(
      z.object({
        delivery_project_user_id: z.string(),
        delivery_project_id: z.string(),
      }),
    );

    return async request => {
      const body = parseBody(request.body);

      await deliveryProjectUserStore.delete(body.delivery_project_user_id);

      await Promise.allSettled([
        teamSyncronizer.syncronizeById(body.delivery_project_id),
        entraIdGroupSyncronizer.syncronizeById(body.delivery_project_id),
      ]);

      await catalogRefresher.refresh(`location:default/delivery-programmes`);
      return noContent();
    };
  },
});
