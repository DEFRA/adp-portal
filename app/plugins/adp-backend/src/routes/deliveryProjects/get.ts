import { createEndpointRef } from '../util';
import { deliveryProjectUserStoreRef } from '../../deliveryProjectUser';
import { deliveryProjectStoreRef } from '../../deliveryProject';
import { deliveryProgrammeAdminStoreRef } from '../../deliveryProgrammeAdmin';
import { type Request } from 'express';
import { getDeliveryProject } from './getDeliveryProject';

export default createEndpointRef({
  deps: {
    deliveryProjectStore: deliveryProjectStoreRef,
    deliveryProjectUserStore: deliveryProjectUserStoreRef,
    deliveryProgrammeAdminStore: deliveryProgrammeAdminStoreRef,
  },
  factory({
    deps: {
      deliveryProjectStore,
      deliveryProjectUserStore,
      deliveryProgrammeAdminStore,
    },
    responses: { ok },
  }) {
    return async (request: Request<{ id: string }>) => {
      const data = await getDeliveryProject(
        deliveryProjectStore,
        deliveryProjectUserStore,
        deliveryProgrammeAdminStore,
        request.params.id,
      );
      return ok().json(data);
    };
  },
});
