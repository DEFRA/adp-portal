import { createEndpointRef } from '../util';
import { catalogApiRef } from '../../refs';
import { deliveryProgrammeStoreRef } from '../../deliveryProgramme';
import { createParser, getUserEntityFromCatalog } from '../../utils';
import { type CreateDeliveryProgrammeRequest } from '@internal/plugin-adp-common';
import { z } from 'zod';
import { deliveryProgrammeAdminStoreRef } from '../../deliveryProgrammeAdmin';
import type { UUID } from 'node:crypto';
import { fireAndForgetCatalogRefresherRef } from '../../services';
import { errorMapping } from './errorMapping';
import {
  identityProviderRef,
  tokenProviderRef,
} from '@internal/plugin-credentials-context-backend';

export default createEndpointRef({
  name: 'createDeliveryProgramme',
  deps: {
    tokenProvider: tokenProviderRef,
    identity: identityProviderRef,
    deliveryProgrammeStore: deliveryProgrammeStoreRef,
    deliveryProgrammeAdminStore: deliveryProgrammeAdminStoreRef,
    catalog: catalogApiRef,
    catalogRefresher: fireAndForgetCatalogRefresherRef,
  },
  factory({
    deps: {
      tokenProvider,
      identity,
      deliveryProgrammeStore,
      deliveryProgrammeAdminStore,
      catalog,
      catalogRefresher,
    },
    responses: { created, validationErrors },
  }) {
    const parseBody = createParser<CreateDeliveryProgrammeRequest>(
      z.object({
        title: z.string(),
        alias: z.string().optional(),
        description: z.string(),
        arms_length_body_id: z.string(),
        delivery_programme_code: z.string(),
        url: z.string().optional(),
      }),
    );

    return async request => {
      const body = parseBody(request.body);
      const { token } = await tokenProvider.getPluginRequestToken('catalog');
      const { userEntityRef } = await identity.getCurrentIdentity();
      const addProgramme = await deliveryProgrammeStore.add(
        body,
        userEntityRef,
      );
      if (!addProgramme.success)
        return validationErrors(addProgramme.errors, errorMapping, body);

      const creator = await getUserEntityFromCatalog(
        userEntityRef.replace(/^user:default\//, ''),
        catalog,
        token,
      );
      if (creator.success) {
        await deliveryProgrammeAdminStore.add({
          name: creator.value.spec.profile!.displayName!,
          email: creator.value.metadata.annotations!['microsoft.com/email'],
          aad_entity_ref_id:
            creator.value.metadata.annotations!['graph.microsoft.com/user-id'],
          delivery_programme_id: addProgramme.value.id as UUID,
          user_entity_ref: userEntityRef,
        });
      }

      await catalogRefresher.refresh(`location:default/delivery-programmes`);
      return created().json(addProgramme.value);
    };
  },
});
