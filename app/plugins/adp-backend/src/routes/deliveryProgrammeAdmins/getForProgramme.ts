import { deliveryProgrammeAdminStoreRef } from '../../deliveryProgrammeAdmin';
import { createEndpointRef } from '../util';
import type { Request } from 'express';

export default createEndpointRef({
  deps: {
    deliveryProgrammeAdminStore: deliveryProgrammeAdminStoreRef,
  },
  factory({ deps: { deliveryProgrammeAdminStore }, responses: { ok } }) {
    return async (request: Request<{ deliveryProgrammeId: string }>) => {
      const result = await deliveryProgrammeAdminStore.getByDeliveryProgramme(
        request.params.deliveryProgrammeId,
      );
      return ok().json(result);
    };
  },
});
