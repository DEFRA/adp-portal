import { useState, useEffect } from 'react';
import { useApi, errorApiRef } from '@backstage/core-plugin-api';
import { armsLengthBodyApiRef } from '../components/ALB/api';

type ArmsLengthBodyListOptions = {
  label: string;
  value: string;
};

export const useArmsLengthBodyList = (): { label: string; value: string }[] => {
  const [options, setOptions] = useState<ArmsLengthBodyListOptions[]>([]);

  const errorApi = useApi(errorApiRef);
  const client = useApi(armsLengthBodyApiRef);

  useEffect(() => {
    (async () => {
      try {
        const bodies = await client.getArmsLengthBodyNames();
        const formattedBodies = Object.entries(bodies).map(
          ([value, label]) => ({
            label,
            value,
          }),
        );
        setOptions(formattedBodies);
      } catch (e: any) {
        errorApi.post(e);
      }
    })();
  }, [client, errorApi]);

  return options;
};
