import { deliveryProjectUserServiceRef } from '../../services';
import { createEndpointRef } from '../util';

export default createEndpointRef({
  name: 'getAllDeliveryProjectUsers',
  deps: {
    service: deliveryProjectUserServiceRef,
  },
  factory({ deps: { service }, responses: { ok } }) {
    return async () => {
      const data = await service.getAll();
      return ok().json(data);
    };
  },
});
