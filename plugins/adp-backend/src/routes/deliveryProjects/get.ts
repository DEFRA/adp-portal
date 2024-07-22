import { createEndpointRef } from '../util';
import { type Request } from 'express';
import { deliveryProjectServiceRef } from '../../services';

export default createEndpointRef({
  name: 'getDeliveryProject',
  deps: {
    service: deliveryProjectServiceRef,
  },
  factory({ deps: { service }, responses: { ok } }) {
    return async (request: Request<{ id: string }>) => {
      const data = await service.getById(request.params.id);
      return ok().json(data);
    };
  },
});
