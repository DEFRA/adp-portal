import { useMemo } from 'react';
import {
  useApi,
  errorApiRef,
  identityApiRef,
} from '@backstage/core-plugin-api';
import { deliveryProgrammeApiRef } from '../components/DeliveryProgramme/api';
import type { DeliveryProgramme } from '@internal/plugin-adp-common';
import { useAsync } from 'react-use';
import { isError } from '@backstage/errors';

export const useDeliveryProgrammesList = (
  selected?: string,
): Map<string, DeliveryProgramme> => {
  const identityApi = useApi(identityApiRef);
  const client = useApi(deliveryProgrammeApiRef);
  const profile = useAsyncAlert(
    () => identityApi.getProfileInfo(),
    [identityApi],
  );
  const deliveryProgrammes = useAsyncAlert(
    () => client.getDeliveryProgrammes(),
    [client],
  );
  const deliveryProgrammeAdmins = useAsyncAlert(
    () => client.getDeliveryProgrammeAdmins(),
    [client],
  );

  return useMemo(() => {
    const { email } = profile.value ?? {};
    const programmes = deliveryProgrammes.value ?? [];
    const programmeAdmins = deliveryProgrammeAdmins.value ?? [];
    const programmesForCurrentUser = programmeAdmins
      .filter(p => p.email.toLowerCase() === email?.toLowerCase())
      .map(p => p.delivery_programme_id);
    const filteredProgrammes = programmes.filter(
      p => selected === p.id || programmesForCurrentUser.includes(p.id),
    );
    return new Map(filteredProgrammes.map(x => [x.id, x]));
  }, [selected, profile, deliveryProgrammes, deliveryProgrammeAdmins]);
};

function useAsyncAlert<T>(fn: () => Promise<T> | T, deps?: readonly unknown[]) {
  const errorApi = useApi(errorApiRef);
  return useAsync(async () => {
    try {
      return await fn();
    } catch (err) {
      if (isError(err)) errorApi.post(err);
      throw err;
    }
  }, [...(deps ?? []), errorApi]);
}
