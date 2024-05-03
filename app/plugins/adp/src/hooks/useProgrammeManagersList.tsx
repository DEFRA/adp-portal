import { useState, useEffect } from 'react';
import {
  useApi,
  discoveryApiRef,
  fetchApiRef,
  errorApiRef,
} from '@backstage/core-plugin-api';

type ProgrammeManagersListOptions = {
  label: string;
  value: string;
};

export const useProgrammeManagersList = (): ProgrammeManagersListOptions[] => {
  const [options, setOptions] = useState<ProgrammeManagersListOptions[]>([]);

  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const errorApi = useApi(errorApiRef);

  useEffect(() => {
    const fetchProgrammeManagersList = async () => {
      try {
        const ProgrammeManagersListUrl =
          `${await discoveryApi.getBaseUrl('adp')  }/catalogentities`;
        const response = await fetchApi.fetch(ProgrammeManagersListUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch programme managers list');
        }
        const data = await response.json();

        const formattedProgrammeManagers = data.items.map((item: any) => {
          const transformedName = item.spec.profile.displayName;
          return {
            label: transformedName,
            value: item.metadata.annotations['graph.microsoft.com/user-id'],
          };
        }).sort((a: { label: string; }, b: { label: string; }) => a.label.localeCompare(b.label));

        setOptions(formattedProgrammeManagers);
      } catch (e: any) {
        errorApi.post(e);
      }
    };

    fetchProgrammeManagersList();
  }, [discoveryApi, fetchApi, errorApi]);

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
