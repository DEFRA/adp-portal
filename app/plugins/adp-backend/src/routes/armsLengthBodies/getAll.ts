import { armsLengthBodyStoreRef } from '../../armsLengthBody';
import { deliveryProgrammeStoreRef } from '../../deliveryProgramme';
import { createEndpointRef } from '../util';

export default createEndpointRef({
  deps: {
    armsLengthBodyStore: armsLengthBodyStoreRef,
    deliveryProgrammeStore: deliveryProgrammeStoreRef,
  },
  factory({
    deps: { armsLengthBodyStore, deliveryProgrammeStore },
    responses: { ok },
  }) {
    return async () => {
      const albData = await armsLengthBodyStore.getAll();
      const programmeData = await deliveryProgrammeStore.getAll();

      for (const alb of albData) {
        alb.children = programmeData
          .filter(p => p.arms_length_body_id === alb.id)
          .map(p => p.id);
      }

      return ok().json(albData);
    };
  },
});
