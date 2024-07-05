import { deliveryProjectUserStoreRef } from '../../deliveryProjectUser';
import {
  getUserEntityFromCatalog,
  assertUUID,
  createParser,
} from '../../utils';
import { type CreateDeliveryProjectUserRequest } from '@internal/plugin-adp-common';
import { z } from 'zod';
import { deliveryProjectGithubTeamsSyncronizerRef } from '../../githubTeam';
import { deliveryProjectEntraIdGroupsSyncronizerRef } from '../../entraId';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { createEndpointRef } from '../util';
import { catalogApiRef } from '../../refs';
import { fireAndForgetCatalogRefresherRef } from '../../services';
import { errorMapping } from './errorMapping';
import { tokenProviderRef } from '@internal/plugin-credentials-context-backend';

export default createEndpointRef({
  name: 'addDeliveryProjectUser',
  deps: {
    tokenProvider: tokenProviderRef,
    catalog: catalogApiRef,
    deliveryProjectUserStore: deliveryProjectUserStoreRef,
    teamSyncronizer: deliveryProjectGithubTeamsSyncronizerRef,
    catalogRefresher: fireAndForgetCatalogRefresherRef,
    entraIdGroupSyncronizer: deliveryProjectEntraIdGroupsSyncronizerRef,
  },
  factory({
    deps: {
      tokenProvider,
      catalog,
      deliveryProjectUserStore,
      teamSyncronizer,
      catalogRefresher,
      entraIdGroupSyncronizer,
    },
    responses: { created, validationErrors },
  }) {
    const parseBody = createParser<CreateDeliveryProjectUserRequest>(
      z.object({
        user_catalog_name: z.string(),
        delivery_project_id: z.string(),
        is_admin: z.boolean(),
        is_technical: z.boolean(),
        github_username: z.string().optional(),
      }),
    );

    return async request => {
      const body = parseBody(request.body);
      assertUUID(body.delivery_project_id);

      const { token } = await tokenProvider.getPluginRequestToken('catalog');
      const catalogUser = await getUserEntityFromCatalog(
        body.user_catalog_name,
        catalog,
        token,
      );

      if (!catalogUser.success)
        return validationErrors(catalogUser.errors, errorMapping, body);

      const addedUser = await deliveryProjectUserStore.add({
        ...body,
        name: catalogUser.value.spec.profile!.displayName!,
        email: catalogUser.value.metadata.annotations!['microsoft.com/email'],
        aad_entity_ref_id:
          catalogUser.value.metadata.annotations![
            'graph.microsoft.com/user-id'
          ],
        aad_user_principal_name:
          catalogUser.value.metadata.annotations![
            'graph.microsoft.com/user-principal-name'
          ],
        delivery_project_id: body.delivery_project_id,
        user_entity_ref: stringifyEntityRef({
          kind: 'user',
          namespace: 'default',
          name: body.user_catalog_name,
        }),
      });
      if (!addedUser.success)
        return validationErrors(addedUser.errors, errorMapping, body);

      await Promise.allSettled([
        teamSyncronizer.syncronizeById(addedUser.value.delivery_project_id),
        entraIdGroupSyncronizer.syncronizeById(
          addedUser.value.delivery_project_id,
        ),
      ]);

      await catalogRefresher.refresh(`location:default/delivery-programmes`);
      return created().json(addedUser.value);
    };
  },
});
