import { deliveryProgrammeAdminStoreRef } from '../../deliveryProgrammeAdmin';
import {
  assertUUID,
  getUserEntityFromCatalog,
  createParser,
} from '../../utils';
import { type CreateDeliveryProgrammeAdminRequest } from '@internal/plugin-adp-common';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { fireAndForgetCatalogRefresherRef } from '../../services';
import { createEndpointRef } from '../util';
import { tokenProviderRef } from '@internal/plugin-credentials-context-backend';
import { catalogApiRef } from '../../refs';
import { z } from 'zod';
import { errorMapping } from './errorMapping';

export default createEndpointRef({
  name: 'addDeliveryProgrammeAdmin',
  deps: {
    tokens: tokenProviderRef,
    catalog: catalogApiRef,
    deliveryProgrammeAdminStore: deliveryProgrammeAdminStoreRef,
    catalogRefresher: fireAndForgetCatalogRefresherRef,
  },
  factory({
    deps: { tokens, catalog, deliveryProgrammeAdminStore, catalogRefresher },
    responses: { validationErrors, created },
  }) {
    const parseBody = createParser<CreateDeliveryProgrammeAdminRequest>(
      z.object({
        delivery_programme_id: z.string(),
        user_catalog_name: z.string(),
        group_entity_ref: z.string(),
      }),
    );

    return async request => {
      const body = parseBody(request.body);
      assertUUID(body.delivery_programme_id);
      const { token } = await tokens.getPluginRequestToken('catalog');
      const catalogUser = await getUserEntityFromCatalog(
        body.user_catalog_name,
        catalog,
        token,
      );
      if (!catalogUser.success)
        return validationErrors(catalogUser.errors, errorMapping, body);

      const result = await deliveryProgrammeAdminStore.add({
        name: catalogUser.value.spec.profile!.displayName!,
        email: catalogUser.value.metadata.annotations!['microsoft.com/email'],
        aad_entity_ref_id:
          catalogUser.value.metadata.annotations![
            'graph.microsoft.com/user-id'
          ],
        delivery_programme_id: body.delivery_programme_id,
        user_entity_ref: stringifyEntityRef({
          kind: 'user',
          namespace: 'default',
          name: body.user_catalog_name,
        }),
      });
      if (!result.success)
        return validationErrors(result.errors, errorMapping, body);

      await catalogRefresher.refresh(`location:default/delivery-programmes`);
      return created().json(result.value);
    };
  },
});
