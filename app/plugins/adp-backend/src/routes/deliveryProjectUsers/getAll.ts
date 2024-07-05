import { deliveryProjectUserStoreRef } from '../../deliveryProjectUser';
import { createEndpointRef } from '../util';

export default createEndpointRef({
  deps: {
    deliveryProjectUserStore: deliveryProjectUserStoreRef,
  },
  factory({ deps: { deliveryProjectUserStore }, responses: { ok } }) {
    return async () => {
      const data = await deliveryProjectUserStore.getAll();
      return ok().json(data);
    };
  },
});
