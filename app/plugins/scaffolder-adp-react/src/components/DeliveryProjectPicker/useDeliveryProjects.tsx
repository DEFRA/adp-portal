import {
  isUserEntity,
  stringifyEntityRef,
  type UserEntity,
} from '@backstage/catalog-model';
import {
  configApiRef,
  identityApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import {
  catalogApiRef,
  entityPresentationApiRef,
} from '@backstage/plugin-catalog-react';
import type { EntityFilterQuery } from '@backstage/catalog-client';
import { useAsync } from 'react-use';
import { DELIVERY_PROJECT_USER_IS_TECH_MEMBER } from '@internal/plugin-adp-common';

export function useDeliveryProjects() {
  const identityApi = useApi(identityApiRef);
  const catalogApi = useApi(catalogApiRef);
  const entityPresentationApi = useApi(entityPresentationApiRef);
  const config = useApi(configApiRef);
  const adminGroup = `group:default/${config.getString('rbac.platformAdminsGroup')}`;

  return useAsync(async () => {
    const identity = await identityApi.getBackstageIdentity();
    const user = await catalogApi.getEntityByRef(identity.userEntityRef);
    if (!user || !isUserEntity(user))
      return { catalogEntities: [], entityRefToPresentation: new Map() };

    const filter: EntityFilterQuery = {
      kind: 'Group',
      'spec.type': 'delivery-project',
    };

    if (!isMemberOf(user, adminGroup))
      filter[`relations.${DELIVERY_PROJECT_USER_IS_TECH_MEMBER}`] =
        identity.userEntityRef;

    const { items } = await catalogApi.getEntities({
      filter,
      fields: ['metadata.name', 'metadata.namespace', 'metadata.title', 'kind'],
    });

    return {
      catalogEntities: items,
      entityRefToPresentation: new Map(
        await Promise.all(
          items.map(
            async item =>
              [
                stringifyEntityRef(item),
                await entityPresentationApi.forEntity(item).promise,
              ] as const,
          ),
        ),
      ),
    };
  }, [identityApi, catalogApi, entityPresentationApi, adminGroup]);
}

function isMemberOf(user: UserEntity, groupRef: string) {
  return user.relations?.some(
    r => r.type === 'memberOf' && r.targetRef === groupRef,
  );
}
