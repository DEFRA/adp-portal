import { createEndpointRef } from '../util';
import { deliveryProgrammeStoreRef } from '../../deliveryProgramme';
import { deliveryProjectStoreRef } from '../../deliveryProject';

export default createEndpointRef({
  name: 'getAllDeliveryProgrammes',
  deps: {
    deliveryProgrammeStore: deliveryProgrammeStoreRef,
    deliveryProjectStore: deliveryProjectStoreRef,
  },
  factory({
    deps: { deliveryProgrammeStore, deliveryProjectStore },
    responses: { ok },
  }) {
    return async () => {
      const programmeData = await deliveryProgrammeStore.getAll();
      const projectData = await deliveryProjectStore.getAll();
      for (const programme of programmeData) {
        programme.children = projectData
          .filter(p => p.delivery_programme_id === programme.id)
          .map(p => p.name);
      }
      return ok().json(programmeData);
    };
  },
});
