import { createEndpointRef } from '../util';
import { deliveryProjectServiceRef } from '../../services';

export default createEndpointRef({
  name: 'getAllDeliveryProjects',
  deps: {
    service: deliveryProjectServiceRef,
  },
  factory({ deps: { service }, responses: { ok } }) {
    return async () => {
      const data = await service.getAll();
      return ok().json(data);
    };
  },
});
