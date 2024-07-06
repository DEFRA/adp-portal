import { createEndpointRef } from '../util';
import { deliveryProgrammeServiceRef } from '../../services';

export default createEndpointRef({
  name: 'getAllDeliveryProgrammes',
  deps: {
    service: deliveryProgrammeServiceRef,
  },
  factory({ deps: { service }, responses: { ok } }) {
    return async () => {
      const data = await service.getAll();
      return ok().json(data);
    };
  },
});
