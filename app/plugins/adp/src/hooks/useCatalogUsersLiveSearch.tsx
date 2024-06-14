import { useCallback } from 'react';
import { useApi, errorApiRef } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import type { Entity, UserEntityV1alpha1 } from '@backstage/catalog-model';
import { DROPDOWN_OPTIONS_BATCH_SIZE } from '../utils';
import { useAsyncDataSource } from './useAsyncDataSource';

export type CatalogUsersListOptions = {
  label: string;
  value: string;
};

export const useCatalogUsersLiveSearch = (
  pageSize = DROPDOWN_OPTIONS_BATCH_SIZE,
): ((input: string) => Promise<
  Array<{
    label: string;
    value: string;
  }>
>) => {
  const errorApi = useApi(errorApiRef);
  const catalog = useApi(catalogApiRef);
  const allUsers = useAsyncDataSource(
    () =>
      catalog.getEntities({
        filter: {
          kind: 'User',
        },
        fields: [
          'metadata.name',
          'metadata.annotations.graph.microsoft.com/user-id',
          'metadata.annotations.microsoft.com/email',
          'spec.profile.displayName',
        ],
        order: {
          field: 'metadata.annotations.microsoft.com/email',
          order: 'asc',
        },
      }),
    (error: any) => errorApi.post(error),
  );

  return useCallback(
    async (input: string) => {
      const allUserEntities =
        allUsers.data?.items
          .map((entity: Entity) => {
            const userEntity = entity as UserEntityV1alpha1;
            const displayName =
              userEntity.spec.profile!.displayName ?? userEntity.metadata.name;
            return {
              label: displayName,
              value: userEntity.metadata.name,
            };
          })
          .sort((a: { label: string }, b: { label: string }) =>
            a.label.localeCompare(b.label),
          ) ?? [];
      return input === ''
        ? allUserEntities.slice(0, pageSize)
        : allUserEntities
            .filter(u => u.label.includes(input) || u.value.includes(input))
            .slice(0, pageSize);
    },
    [allUsers.data?.items, pageSize],
  );
};
