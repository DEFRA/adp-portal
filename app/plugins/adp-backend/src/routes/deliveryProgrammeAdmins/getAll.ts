import { deliveryProgrammeAdminStoreRef } from '../../deliveryProgrammeAdmin';
import { createEndpointRef } from '../util';

export default createEndpointRef({
  deps: {
    deliveryProgrammeAdminStore: deliveryProgrammeAdminStoreRef,
  },
  factory({ deps: { deliveryProgrammeAdminStore }, responses: { ok } }) {
    return async () => {
      const result = await deliveryProgrammeAdminStore.getAll();
      return ok().json(result);
    };
  },
});
