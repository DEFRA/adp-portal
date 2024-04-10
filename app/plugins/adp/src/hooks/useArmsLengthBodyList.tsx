import { useState, useEffect } from 'react';
import { ArmsLengthBodyClient } from '../components/ALB/api/AlbClient';
import {
  useApi,
  discoveryApiRef,
  fetchApiRef,
  errorApiRef,
} from '@backstage/core-plugin-api';

type ArmsLengthBodyListOptions = {
  label: string;
  value: string;
};

export const useArmsLengthBodyList = (): { label: string; value: string }[]  => {
  const [options, setOptions] = useState<ArmsLengthBodyListOptions[]>([]);

  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const errorApi = useApi(errorApiRef);

  useEffect(() => {
    const albClient = new ArmsLengthBodyClient(discoveryApi, fetchApi);
    const fetchArmsLengthBodiesList = async () => {
      try {
        const bodies = await albClient.getArmsLengthBodyNames();
          const formattedBodies = Object.entries(bodies).map(([value, label]) => ({
            label,
            value,
          }));
        setOptions(formattedBodies);
      } catch (e: any) {
        errorApi.post(e);
      }
    };

    fetchArmsLengthBodiesList();
  }, [discoveryApi, fetchApi, errorApi]);

  return options;
};
