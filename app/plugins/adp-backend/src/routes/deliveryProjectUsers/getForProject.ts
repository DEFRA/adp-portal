import { type Request } from 'express';
import { createEndpointRef } from '../util';
import { deliveryProjectUserServiceRef } from '../../services';

export default createEndpointRef({
  name: 'getDeliveryProjectUsersForDeliveryProject',
  deps: {
    service: deliveryProjectUserServiceRef,
  },
  factory({ deps: { service }, responses: { ok } }) {
    return async (request: Request<{ deliveryProjectId: string }>) => {
      const data = await service.getByProjectId(
        request.params.deliveryProjectId,
      );
      return ok().json(data);
    };
  },
});
