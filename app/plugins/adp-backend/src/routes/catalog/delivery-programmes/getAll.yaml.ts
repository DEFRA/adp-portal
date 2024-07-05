import type { LocationEntity } from '@backstage/catalog-model';
import { deliveryProgrammeStoreRef } from '../../../deliveryProgramme';
import { createEndpointRef } from '../../util';
import { coreServices } from '@backstage/backend-plugin-api';

export default createEndpointRef({
  deps: {
    deliveryProgrammeStore: deliveryProgrammeStoreRef,
    config: coreServices.rootConfig,
  },
  factory({ deps: { deliveryProgrammeStore, config }, responses: { ok } }) {
    const baseUrl = `${config.getString('app.baseUrl')}/onboarding`;
    return async () => {
      const entities = await deliveryProgrammeStore.getAll(['name']);

      return ok().yaml({
        apiVersion: 'backstage.io/v1beta1',
        kind: 'Location',
        metadata: {
          name: 'delivery-programmes',
          description: 'All the delivery programmes available in the system',
        },
        spec: {
          type: 'url',
          targets: entities.map(
            p => `${baseUrl}/delivery-programmes/${p.name}`,
          ),
        },
      } satisfies LocationEntity);
    };
  },
});
