import React from 'react';
import { TestApiProvider } from '@backstage/test-utils';

import {
  alertApiRef,
  errorApiRef,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import { renderHook } from '@testing-library/react-hooks';
import { useArmsLengthBodyList } from './useArmsLengthBodyList';
const mockErrorApi = { post: jest.fn() };
const mockDiscoveryApi = { getBaseUrl: jest.fn() };
const mockFetchApi = { fetch: jest.fn() };
const mockAlertApi = { post: jest.fn() };

jest.mock('../components/ALB/api/AlbClient', () => ({
  ArmsLengthBodyClient: jest.fn().mockImplementation(() => ({
    getArmsLengthBodyNames: jest.fn().mockResolvedValue({
      '1': 'Mock Body 1',
      '2': 'Mock Body 2',
    }),
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
    () => useArmsLengthBodyList(),
    { wrapper },
  );

  await waitForNextUpdate();

  expect(result.current).toEqual([
    { label: 'Mock Body 1', value: '1' },
    { label: 'Mock Body 2', value: '2' },
  ]);
});
