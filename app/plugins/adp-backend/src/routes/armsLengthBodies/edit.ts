import { armsLengthBodyStoreRef } from '../../armsLengthBody';
import { createEndpointRef } from '../util';
import { createParser } from '../../utils';
import type { UpdateArmsLengthBodyRequest } from '@internal/plugin-adp-common';
import { z } from 'zod';
import errorMapping from './errorMapping';
import { fireAndForgetCatalogRefresherRef } from '../../services';
import { identityProviderRef } from '@internal/plugin-credentials-context-backend';

export default createEndpointRef({
  name: 'editArmsLengthBody',
  deps: {
    armsLengthBodyStore: armsLengthBodyStoreRef,
    identity: identityProviderRef,
    catalogRefresher: fireAndForgetCatalogRefresherRef,
  },
  factory({
    deps: { armsLengthBodyStore, identity, catalogRefresher },
    responses: { ok, validationErrors },
  }) {
    const parseBody = createParser<UpdateArmsLengthBodyRequest>(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        alias: z.string().optional(),
        description: z.string().optional(),
        url: z.string().optional(),
      }),
    );

    return async request => {
      const body = parseBody(request.body);
      const { userEntityRef } = await identity.getCurrentIdentity();
      const result = await armsLengthBodyStore.update(body, userEntityRef);
      if (!result.success)
        return validationErrors(result.errors, errorMapping, body);

      await catalogRefresher.refresh(`group:default/${result.value.name}`);
      return ok().json(result.value);
    };
  },
});
