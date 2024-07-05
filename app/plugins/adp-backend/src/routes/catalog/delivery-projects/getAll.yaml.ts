import {
  ANNOTATION_EDIT_URL,
  ANNOTATION_VIEW_URL,
  type LocationEntity,
} from '@backstage/catalog-model';
import { deliveryProjectStoreRef } from '../../../deliveryProject';
import { createEndpointRef } from '../../util';
import { coreServices } from '@backstage/backend-plugin-api';

export default createEndpointRef({
  name: 'getDeliveryProjectsIndexYaml',
  deps: {
    deliveryProjectStore: deliveryProjectStoreRef,
    config: coreServices.rootConfig,
  },
  factory({ deps: { deliveryProjectStore, config }, responses: { ok } }) {
    const baseUrl = `${config.getString('app.baseUrl')}/onboarding`;
    return async () => {
      const entities = await deliveryProjectStore.getAll();

      return ok().yaml({
        apiVersion: 'backstage.io/v1beta1',
        kind: 'Location',
        metadata: {
          name: 'delivery-projects',
          description: 'All the delivery projects available in the system',
          annotations: {
            [ANNOTATION_EDIT_URL]: `${baseUrl}/delivery-projects`,
            [ANNOTATION_VIEW_URL]: `${baseUrl}/delivery-projects`,
          },
        },
        spec: {
          type: 'url',
          targets: entities.map(p => `${baseUrl}/delivery-projects/${p.name}`),
        },
      } satisfies LocationEntity);
    };
  },
});
