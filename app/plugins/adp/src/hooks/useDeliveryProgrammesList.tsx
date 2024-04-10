import { useState, useEffect } from 'react';
import {
  useApi,
  discoveryApiRef,
  fetchApiRef,
  errorApiRef,
} from '@backstage/core-plugin-api';
import { DeliveryProgrammeClient } from '../components/DeliveryProgramme/api';

type ProgrammesListOptions = {
  label: string;
  value: string;
};

export const useDeliveryProgrammesList = (): ProgrammesListOptions[] => {
  const [options, setOptions] = useState<ProgrammesListOptions[]>([]);

  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const errorApi = useApi(errorApiRef);

  useEffect(() => {
    const deliveryProgammeClient = new DeliveryProgrammeClient(discoveryApi, fetchApi);
    const fetchProgrammesList = async () => {
      try {
        const programmes = await deliveryProgammeClient.getDeliveryProgrammes();
        const formattedProgrammes = programmes.map(x => {
          return {
            label: x.title,
            value: x.id
          }
        });
        setOptions(formattedProgrammes);
      } catch (e: any) {
        errorApi.post(e);
      }
    };

    fetchProgrammesList();
  }, [discoveryApi, fetchApi, errorApi]);

  return options;
};
