import { deliveryProgrammeAdminServiceRef } from '../../services';
import { createEndpointRef } from '../util';

export default createEndpointRef({
  name: 'getAllDeliveryProgrammeAdmins',
  deps: {
    service: deliveryProgrammeAdminServiceRef,
  },
  factory({ deps: { service }, responses: { ok } }) {
    return async () => {
      const result = await service.getAll();
      return ok().json(result);
    };
  },
});
