import { createEndpointRef } from '../util';
import { deliveryProgrammeStoreRef } from '../../deliveryProgramme';
import { type Request } from 'express';
import { deliveryProgrammeAdminStoreRef } from '../../deliveryProgrammeAdmin';
import { getDeliveryProgramme } from './getDeliveryProgramme';

export default createEndpointRef({
  deps: {
    deliveryProgrammeStore: deliveryProgrammeStoreRef,
    deliveryProgrammeAdminStore: deliveryProgrammeAdminStoreRef,
  },
  factory({
    deps: { deliveryProgrammeAdminStore, deliveryProgrammeStore },
    responses: { ok },
  }) {
    return async (request: Request<{ id: string }>) => {
      const deliveryProgramme = await getDeliveryProgramme(
        deliveryProgrammeStore,
        deliveryProgrammeAdminStore,
        request.params.id,
      );
      return ok().json(deliveryProgramme);
    };
  },
});
