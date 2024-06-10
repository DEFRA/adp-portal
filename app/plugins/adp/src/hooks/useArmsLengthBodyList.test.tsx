import React from 'react';
import { TestApiProvider } from '@backstage/test-utils';

import type { AlertApi, ErrorApi } from '@backstage/core-plugin-api';
import { alertApiRef, errorApiRef } from '@backstage/core-plugin-api';
import { renderHook } from '@testing-library/react-hooks';
import { useArmsLengthBodyList } from './useArmsLengthBodyList';
import type { ArmsLengthBodyApi } from '../components/ALB/api';
import { armsLengthBodyApiRef } from '../components/ALB/api';

it('fetches and formats data correctly', async () => {
  const mockAlertApi: jest.Mocked<AlertApi> = {
    alert$: jest.fn(),
    post: jest.fn(),
  };
  const mockErrorApi: jest.Mocked<ErrorApi> = {
    error$: jest.fn(),
    post: jest.fn(),
  };
  const mockAlbApi: jest.Mocked<ArmsLengthBodyApi> = {
    createArmsLengthBody: jest.fn(),
    getArmsLengthBodies: jest.fn(),
    getArmsLengthBodyNames: jest.fn(),
    updateArmsLengthBody: jest.fn(),
  };

  const wrapper = ({ children }: React.PropsWithChildren) => (
    <TestApiProvider
      apis={[
        [alertApiRef, mockAlertApi],
        [errorApiRef, mockErrorApi],
        [armsLengthBodyApiRef, mockAlbApi],
      ]}
    >
      {children}
    </TestApiProvider>
  );

  mockAlbApi.getArmsLengthBodyNames.mockResolvedValueOnce({
    '1': 'Mock Body 1',
    '2': 'Mock Body 2',
  });

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
