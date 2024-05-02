import React from 'react';
import { TestApiProvider } from '@backstage/test-utils';
import {
  alertApiRef,
  errorApiRef,
  identityApiRef,
  AlertApi,
  ErrorApi,
  IdentityApi,
} from '@backstage/core-plugin-api';
import { renderHook } from '@testing-library/react-hooks';
import { useDeliveryProgrammesList } from './useDeliveryProgrammesList';
import {
  DeliveryProgrammeApi,
  deliveryProgrammeApiRef,
} from '../components/DeliveryProgramme/api';

it('fetches and formats data correctly', async () => {
  const mockAlertApi: jest.Mocked<AlertApi> = {
    alert$: jest.fn(),
    post: jest.fn(),
  };
  const mockErrorApi: jest.Mocked<ErrorApi> = {
    error$: jest.fn(),
    post: jest.fn(),
  };
  const mockIdentityApi: jest.Mocked<IdentityApi> = {
    getBackstageIdentity: jest.fn(),
    getCredentials: jest.fn(),
    getProfileInfo: jest.fn(),
    signOut: jest.fn(),
  };
  const mockProgrammeApi: jest.Mocked<DeliveryProgrammeApi> = {
    createDeliveryProgramme: jest.fn(),
    getDeliveryProgrammeAdmins: jest.fn(),
    getDeliveryProgrammeById: jest.fn(),
    getDeliveryProgrammes: jest.fn(),
    updateDeliveryProgramme: jest.fn(),
  };

  mockIdentityApi.getProfileInfo.mockResolvedValueOnce({
    email: 'x@y.com',
  });
  mockProgrammeApi.getDeliveryProgrammeAdmins.mockResolvedValueOnce([
    {
      id: '1',
      delivery_programme_id: '1',
      aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73421',
      email: 'x@y.com',
      name: 'manager1',
      updated_at: new Date(0),
    },
  ]);
  mockProgrammeApi.getDeliveryProgrammes.mockResolvedValueOnce([
    {
      id: '1',
      title: 'prg1',
      arms_length_body_id: '',
      created_at: new Date(0),
      delivery_programme_code: '',
      description: '',
      name: '',
      programme_managers: [],
      updated_at: new Date(0),
    },
  ]);

  const wrapper: React.FC = ({ children }) => (
    <TestApiProvider
      apis={[
        [alertApiRef, mockAlertApi],
        [errorApiRef, mockErrorApi],
        [identityApiRef, mockIdentityApi],
        [deliveryProgrammeApiRef, mockProgrammeApi],
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

  expect(result.current).toMatchObject(
    new Map([['1', { id: '1', title: 'prg1' }]]),
  );
});
