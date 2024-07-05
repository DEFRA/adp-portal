import { armsLengthBodyStoreRef } from '../../armsLengthBody';
import { createEndpointRef } from '../util';
import { createParser, getCurrentUsername, getOwner } from '../../utils';
import type { CreateArmsLengthBodyRequest } from '@internal/plugin-adp-common';
import { z } from 'zod';
import { authIdentityRef } from '../../refs';
import { coreServices } from '@backstage/backend-plugin-api';
import errorMapping from './errorMapping';
import { fireAndForgetCatalogRefresherRef } from '../../services';

export default createEndpointRef({
  deps: {
    armsLengthBodyStore: armsLengthBodyStoreRef,
    identity: authIdentityRef,
    config: coreServices.rootConfig,
    catalogRefresher: fireAndForgetCatalogRefresherRef,
  },
  factory({
    deps: { armsLengthBodyStore, identity, config, catalogRefresher },
    responses: { created, validationErrors },
  }) {
    const owner = getOwner(config);
    const parseBody = createParser<CreateArmsLengthBodyRequest>(
      z.object({
        title: z.string(),
        description: z.string(),
        alias: z.string().optional(),
        url: z.string().optional(),
      }),
    );

    return async request => {
      const body = parseBody(request.body);
      const creator = await getCurrentUsername(identity, request);
      const result = await armsLengthBodyStore.add(body, creator, owner);
      if (!result.success)
        return validationErrors(result.errors, errorMapping, body);

      await catalogRefresher.refresh('location:default/arms-length-bodies');
      return created().json(result.value);
    };
  },
});
