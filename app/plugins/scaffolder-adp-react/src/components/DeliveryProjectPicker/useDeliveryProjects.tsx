import { stringifyEntityRef } from '@backstage/catalog-model';
import { identityApiRef, useApi } from '@backstage/core-plugin-api';
import {
  catalogApiRef,
  entityPresentationApiRef,
} from '@backstage/plugin-catalog-react';
import { useAsync } from 'react-use';

export function useDeliveryProjects() {
  const identityApi = useApi(identityApiRef);
  const catalogApi = useApi(catalogApiRef);
  const entityPresentationApi = useApi(entityPresentationApiRef);

  return useAsync(async () => {
    const identity = await identityApi.getBackstageIdentity();
    const { items } = await catalogApi.getEntities({
      filter: {
        kind: 'Group',
        'spec.type': 'delivery-project',
        'relations.hasMember': identity.userEntityRef,
      },
      fields: ['metadata.name', 'metadata.namespace', 'metadata.title', 'kind'],
    });

    return {
      catalogEntities: items,
      entityRefToPresentation: new Map(
        await Promise.all(
          items.map(async item => {
            const presentation =
              await entityPresentationApi.forEntity(item).promise;
            return [stringifyEntityRef(item), presentation] as const;
          }),
        ),
      ),
    };
  }, [identityApi, catalogApi, entityPresentationApi]);
}
