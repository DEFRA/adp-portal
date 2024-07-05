import { deliveryProjectUserStoreRef } from '../../deliveryProjectUser';
import { type Request } from 'express';
import { createEndpointRef } from '../util';

export default createEndpointRef({
  name: 'getDeliveryProjectUsersForDeliveryProject',
  deps: {
    deliveryProjectUserStore: deliveryProjectUserStoreRef,
  },
  factory({ deps: { deliveryProjectUserStore }, responses: { ok } }) {
    return async (request: Request<{ deliveryProjectId: string }>) => {
      const data = await deliveryProjectUserStore.getByDeliveryProject(
        request.params.deliveryProjectId,
      );
      return ok().json(data);
    };
  },
});
