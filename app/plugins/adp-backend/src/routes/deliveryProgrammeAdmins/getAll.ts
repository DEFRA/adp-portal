import { deliveryProgrammeAdminStoreRef } from '../../deliveryProgrammeAdmin';
import { createEndpointRef } from '../util';

export default createEndpointRef({
  name: 'getAllDeliveryProgrammeAdmins',
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
