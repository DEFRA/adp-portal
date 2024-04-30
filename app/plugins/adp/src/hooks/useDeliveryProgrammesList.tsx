import { useState, useEffect } from 'react';
import {
  useApi,
  discoveryApiRef,
  fetchApiRef,
  errorApiRef,
  identityApiRef,
} from '@backstage/core-plugin-api';
import { DeliveryProgrammeClient } from '../components/DeliveryProgramme/api';
import { DeliveryProgramme } from '@internal/plugin-adp-common';

export const useDeliveryProgrammesList = (): Map<string, DeliveryProgramme> => {
  const [options, setOptions] = useState(new Map<string, DeliveryProgramme>());

  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const errorApi = useApi(errorApiRef);
  const identityApi = useApi(identityApiRef);

  useEffect(() => {
    const deliveryProgammeClient = new DeliveryProgrammeClient(
      discoveryApi,
      fetchApi,
    );
    const fetchProgrammesList = async () => {
      const { email } = await identityApi.getProfileInfo();
      const programmes = await deliveryProgammeClient.getDeliveryProgrammes();
      const programmeManagers =
        await deliveryProgammeClient.getDeliveryProgrammeAdmins();
      const programmesForCurrentUser = programmeManagers
        .filter(p => p.email.toLowerCase() === email?.toLowerCase())
        .map(p => p.delivery_programme_id);
      const filteredProgrammes = programmes.filter(p =>
        programmesForCurrentUser.includes(p.id),
      );
      setOptions(new Map(filteredProgrammes.map(x => [x.id, x])));
    };

    fetchProgrammesList().catch(e => errorApi.post(e));
  }, [discoveryApi, fetchApi, errorApi, identityApi]);

  return options;
};
