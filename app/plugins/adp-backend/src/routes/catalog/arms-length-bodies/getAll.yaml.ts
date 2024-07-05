import type { LocationEntity } from '@backstage/catalog-model';
import { createEndpointRef } from '../../util';
import { coreServices } from '@backstage/backend-plugin-api';
import { armsLengthBodyStoreRef } from '../../../armsLengthBody';

export default createEndpointRef({
  deps: {
    armsLengthBodyStore: armsLengthBodyStoreRef,
    config: coreServices.rootConfig,
  },
  factory({ deps: { armsLengthBodyStore, config }, responses: { ok } }) {
    const baseUrl = `${config.getString('app.baseUrl')}/onboarding`;
    return async () => {
      const entities = await armsLengthBodyStore.getAll(['name']);

      return ok().yaml({
        apiVersion: 'backstage.io/v1beta1',
        kind: 'Location',
        metadata: {
          name: 'arms-length-bodies',
          description: 'All the arms length bodies available in the system',
        },
        spec: {
          type: 'url',
          targets: entities.map(p => `${baseUrl}/arms-length-bodies/${p.name}`),
        },
      } satisfies LocationEntity);
    };
  },
});
