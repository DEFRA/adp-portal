import { deliveryProjectUserStoreRef } from '../../deliveryProjectUser';
import { getUserEntityFromCatalog, createParser } from '../../utils';
import { type UpdateDeliveryProjectUserRequest } from '@internal/plugin-adp-common';
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
  name: 'updateDeliveryProjectUser',
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
    responses: { ok, validationErrors },
  }) {
    const parseBody = createParser<UpdateDeliveryProjectUserRequest>(
      z.object({
        id: z.string(),
        delivery_project_id: z.string(),
        is_technical: z.boolean().optional(),
        is_admin: z.boolean().optional(),
        github_username: z.string().optional(),
        user_catalog_name: z.string(),
      }),
    );

    return async request => {
      const body = parseBody(request.body);
      const { token } = await tokenProvider.getPluginRequestToken('catalog');
      const catalogUser = await getUserEntityFromCatalog(
        body.user_catalog_name,
        catalog,
        token,
      );

      if (!catalogUser.success)
        return validationErrors(catalogUser.errors, errorMapping, body);

      const result = await deliveryProjectUserStore.update({
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
        user_entity_ref: stringifyEntityRef({
          kind: 'user',
          namespace: 'default',
          name: body.user_catalog_name,
        }),
      });

      if (!result.success)
        return validationErrors(result.errors, errorMapping, body);

      await Promise.allSettled([
        teamSyncronizer.syncronizeById(result.value.delivery_project_id),
        entraIdGroupSyncronizer.syncronizeById(
          result.value.delivery_project_id,
        ),
      ]);

      await catalogRefresher.refresh(`location:default/delivery-programmes`);
      return ok().json(result.value);
    };
  },
});