import { useState, useEffect } from 'react';
import { useApi, errorApiRef } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import type { Entity, UserEntityV1alpha1 } from '@backstage/catalog-model';

type CatalogUsersListOptions = {
  label: string;
  value: string;
};

export const useCatalogUsersList = (): { label: string; value: string }[] => {
  const [options, setOptions] = useState<CatalogUsersListOptions[]>([]);

  const errorApi = useApi(errorApiRef);
  const catalog = useApi(catalogApiRef);

  useEffect(() => {
    (async () => {
      try {
        const userEntities = await catalog.getEntities({
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
        });

        const users = userEntities.items
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
          );

        setOptions(users);
      } catch (error: any) {
        errorApi.post(error);
      }
    })();
  }, [catalog, errorApi]);

  return options;
};

export const transformedData = async (deliveryProgramme: any) => {
  const formattedProgrammeManagers = deliveryProgramme.programme_managers.map(
    (manager: any) => {
      if (manager.aad_entity_ref_id === undefined) {
        return { aad_entity_ref_id: manager };
      }

      return manager;
    },
  );
  const data = {
    ...deliveryProgramme,
    programme_managers: formattedProgrammeManagers,
  };
  return data;
};
