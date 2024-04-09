import React from 'react';
import { TestApiProvider } from '@backstage/test-utils';

import {
  alertApiRef,
  errorApiRef,
  discoveryApiRef,
  fetchApiRef,
  identityApiRef,
} from '@backstage/core-plugin-api';
import { renderHook } from '@testing-library/react-hooks';
import { useDeliveryProgrammesList } from './useDeliveryProgrammesList';
const mockErrorApi = { post: jest.fn() };
const mockDiscoveryApi = { getBaseUrl: jest.fn() };
const mockFetchApi = { fetch: jest.fn() };
const mockAlertApi = { post: jest.fn() };
const mockIdentityApi = {
  getProfileInfo: jest.fn().mockResolvedValue({
    email: 'x@y.com',
  }),
};

jest.mock(
  '../components/DeliveryProgramme/api/DeliveryProgrammeClient',
  () => ({
    DeliveryProgrammeClient: jest.fn().mockImplementation(() => ({
      getDeliveryProgrammes: jest
        .fn()
        .mockResolvedValue([{ id: '1', title: 'prg1' }]),
      getProgrammeManagers: jest.fn().mockResolvedValue([
        {
          id: '1',
          delivery_programme_id: '1',
          aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73421',
          email: 'x@y.com',
          name: 'manager1',
        },
      ]),
    })),
  }),
);

it('fetches and formats data correctly', async () => {
  const wrapper: React.FC = ({ children }) => (
    <TestApiProvider
      apis={[
        [alertApiRef, mockAlertApi],
        [errorApiRef, mockErrorApi],
        [discoveryApiRef, mockDiscoveryApi],
        [fetchApiRef, mockFetchApi],
        [identityApiRef, mockIdentityApi],
      ]}
    >
      {children}
    </TestApiProvider>
  );

  const { result, waitForNextUpdate } = renderHook(
    () => useDeliveryProgrammesList(),
    { wrapper },
  );

  await waitForNextUpdate();

  expect(result.current).toEqual([
    {
      dropdownItem: { label: 'prg1', value: '1' },
      programme: { id: '1', title: 'prg1' },
    },
  ]);
});
