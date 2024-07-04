import { armsLengthBodyStoreRef } from '../../armsLengthBody';
import { createEndpointRef } from '../util';
import { createParser, getCurrentUsername } from '../../utils';
import type { UpdateArmsLengthBodyRequest } from '@internal/plugin-adp-common';
import { z } from 'zod';
import { authIdentityRef } from '../../refs';
import errorMapping from './errorMapping';

export default createEndpointRef({
  deps: {
    armsLengthBodyStore: armsLengthBodyStoreRef,
    identity: authIdentityRef,
  },
  factory({
    deps: { armsLengthBodyStore, identity },
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
      const creator = await getCurrentUsername(identity, request);
      const result = await armsLengthBodyStore.update(body, creator);
      if (!result.success)
        return validationErrors(result.errors, errorMapping, body);

      return ok().json(result.value);
    };
  },
});
