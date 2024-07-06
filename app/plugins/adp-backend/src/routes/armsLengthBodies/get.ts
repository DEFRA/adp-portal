import type { Request } from 'express';
import { createEndpointRef } from '../util';
import { armsLengthBodyServiceRef } from '../../services';

export default createEndpointRef({
  name: 'getArmsLengthBody',
  deps: {
    service: armsLengthBodyServiceRef,
  },
  factory({ deps: { service }, responses: { ok } }) {
    return async (request: Request<{ id: string }>) => {
      const data = await service.getById(request.params.id);
      return ok().json(data);
    };
  },
});
