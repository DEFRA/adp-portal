import React from 'react';
import { TestApiProvider } from '@backstage/test-utils';

import {
  alertApiRef,
  errorApiRef,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import { renderHook } from '@testing-library/react-hooks';
import { useDeliveryProgrammesList } from './useDeliveryProgrammesList';
const mockErrorApi = { post: jest.fn() };
const mockDiscoveryApi = { getBaseUrl: jest.fn() };
const mockFetchApi = { fetch: jest.fn() };
const mockAlertApi = { post: jest.fn() };

jest.mock('../components/DeliveryProgramme/api/DeliveryProgrammeClient', () => ({
  DeliveryProgrammeClient: jest.fn().mockImplementation(() => ({
    getDeliveryProgrammes: jest.fn().mockResolvedValue([{ id: '1', title: 'prg1' }]),
  })),
}));

it('fetches and formats data correctly', async () => {
  const wrapper: React.FC = ({ children }) => (
    <TestApiProvider
      apis={[
        [alertApiRef, mockAlertApi],
        [errorApiRef, mockErrorApi],
        [discoveryApiRef, mockDiscoveryApi],
        [fetchApiRef, mockFetchApi],
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
    { label: 'prg1', value: '1' },
  ]);
});
