import { createEndpointRef } from '../util';
import { deliveryProgrammeStoreRef } from '../../deliveryProgramme';
import { createParser } from '../../utils';
import { type UpdateDeliveryProgrammeRequest } from '@internal/plugin-adp-common';
import { z } from 'zod';
import { fireAndForgetCatalogRefresherRef } from '../../services';
import { errorMapping } from './errorMapping';
import { identityProviderRef } from '@internal/plugin-credentials-context-backend';

export default createEndpointRef({
  name: 'editDeliveryProgramme',
  deps: {
    identity: identityProviderRef,
    deliveryProgrammeStore: deliveryProgrammeStoreRef,
    catalogRefresher: fireAndForgetCatalogRefresherRef,
  },
  factory({
    deps: { identity, deliveryProgrammeStore, catalogRefresher },
    responses: { ok, validationErrors },
  }) {
    const parseBody = createParser<UpdateDeliveryProgrammeRequest>(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        alias: z.string().optional(),
        description: z.string().optional(),
        arms_length_body_id: z.string().optional(),
        delivery_programme_code: z.string().optional(),
        url: z.string().optional(),
      }),
    );

    return async request => {
      const body = parseBody(request.body);
      const { userEntityRef } = await identity.getCurrentIdentity();
      const result = await deliveryProgrammeStore.update(body, userEntityRef);
      if (!result.success)
        return validationErrors(result.errors, errorMapping, body);

      await catalogRefresher.refresh(`location:default/delivery-programmes`);
      return ok().json(result.value);
    };
  },
});
