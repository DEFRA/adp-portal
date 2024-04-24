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

type ProgrammesList = {
  dropdownItem: {
    label: string;
    value: string;
  };
  programme: DeliveryProgramme;
};

export const useDeliveryProgrammesList = (): ProgrammesList[] => {
  const [options, setOptions] = useState<ProgrammesList[]>([]);

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
      try {
        const loggedInUserProfile = await identityApi.getProfileInfo();
        const programmes = await deliveryProgammeClient.getDeliveryProgrammes();
        const programmeManagers =
          await deliveryProgammeClient.getDeliveryProgrammeAdmins();
        const programmesForCurrentUser = programmeManagers.filter(
          p =>
            p.email.toLowerCase() === loggedInUserProfile.email?.toLowerCase(),
        );
        const filteredProgrammes = programmesForCurrentUser
          .map(p => {
            return programmes.find(x => x.id === p.delivery_programme_id);
          })
          .filter(
            (programme): programme is DeliveryProgramme =>
              programme !== undefined,
          );
        const formattedProgrammes = filteredProgrammes.map(x => {
          return {
            dropdownItem: {
              label: x.title,
              value: x.id,
            },
            programme: x,
          };
        });
        setOptions(formattedProgrammes);
      } catch (e: any) {
        errorApi.post(e);
      }
    };

    fetchProgrammesList();
  }, [discoveryApi, fetchApi, errorApi, identityApi]);

  return options;
};
