import { armsLengthBodyStoreRef } from '../../armsLengthBody';
import { createEndpointRef } from '../util';
import { createParser } from '../../utils';
import type { CreateArmsLengthBodyRequest } from '@internal/plugin-adp-common';
import { z } from 'zod';
import { coreServices } from '@backstage/backend-plugin-api';
import errorMapping from './errorMapping';
import { fireAndForgetCatalogRefresherRef } from '../../services';
import { identityProviderRef } from '@internal/plugin-credentials-context-backend';

export default createEndpointRef({
  name: 'createArmsLengthBody',
  deps: {
    armsLengthBodyStore: armsLengthBodyStoreRef,
    identity: identityProviderRef,
    config: coreServices.rootConfig,
    catalogRefresher: fireAndForgetCatalogRefresherRef,
  },
  factory({
    deps: { armsLengthBodyStore, identity, config, catalogRefresher },
    responses: { created, validationErrors },
  }) {
    const owner = config.getString('rbac.programmeAdminGroup');
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
      const { userEntityRef } = await identity.getCurrentIdentity();
      const result = await armsLengthBodyStore.add(body, userEntityRef, owner);
      if (!result.success)
        return validationErrors(result.errors, errorMapping, body);

      await catalogRefresher.refresh('location:default/arms-length-bodies');
      return created().json(result.value);
    };
  },
});
