import { createEndpointRef } from '../util';
import { deliveryProjectStoreRef } from '../../deliveryProject';

export default createEndpointRef({
  deps: {
    deliveryProjectStore: deliveryProjectStoreRef,
  },
  factory({ deps: { deliveryProjectStore }, responses: { ok } }) {
    return async () => {
      const data = await deliveryProjectStore.getAll();
      return ok().json(data);
    };
  },
});
