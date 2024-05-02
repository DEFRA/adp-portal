import { useState, useEffect } from 'react';
import {
  useApi,
  errorApiRef,
  identityApiRef,
} from '@backstage/core-plugin-api';
import { deliveryProgrammeApiRef } from '../components/DeliveryProgramme/api';
import { DeliveryProgramme } from '@internal/plugin-adp-common';

export const useDeliveryProgrammesList = (): Map<string, DeliveryProgramme> => {
  const [options, setOptions] = useState(new Map<string, DeliveryProgramme>());

  const errorApi = useApi(errorApiRef);
  const identityApi = useApi(identityApiRef);
  const client = useApi(deliveryProgrammeApiRef);

  useEffect(() => {
    const fetchProgrammesList = async () => {
      const { email } = await identityApi.getProfileInfo();
      const programmes = await client.getDeliveryProgrammes();
      const programmeManagers = await client.getDeliveryProgrammeAdmins();
      const programmesForCurrentUser = programmeManagers
        .filter(p => p.email.toLowerCase() === email?.toLowerCase())
        .map(p => p.delivery_programme_id);
      const filteredProgrammes = programmes.filter(p =>
        programmesForCurrentUser.includes(p.id),
      );
      setOptions(new Map(filteredProgrammes.map(x => [x.id, x])));
    };

    fetchProgrammesList().catch(e => errorApi.post(e));
  }, [client, errorApi, identityApi]);

  return options;
};
