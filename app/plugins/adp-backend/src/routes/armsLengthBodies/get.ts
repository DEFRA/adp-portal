import type { Request } from 'express';
import { armsLengthBodyStoreRef } from '../../armsLengthBody';
import { createEndpointRef } from '../util';

export default createEndpointRef({
  deps: {
    armsLengthBodyStore: armsLengthBodyStoreRef,
  },
  factory({ deps: { armsLengthBodyStore }, responses: { ok } }) {
    return async (request: Request<{ id: string }>) => {
      const data = await armsLengthBodyStore.get(request.params.id);
      return ok().json(data);
    };
  },
});
