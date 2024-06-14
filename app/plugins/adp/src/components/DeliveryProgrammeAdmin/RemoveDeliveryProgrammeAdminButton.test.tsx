import { alertApiRef, type AlertApi } from '@backstage/core-plugin-api';
import React from 'react';
import type { RemoveDeliveryProgrammeAdminButtonProps } from './RemoveDeliveryProgrammeAdminButton';
import { RemoveDeliveryProgrammeAdminButton } from './RemoveDeliveryProgrammeAdminButton';
import { render, waitFor } from '@testing-library/react';
import { TestApiProvider } from '@backstage/test-utils';
import type { DeliveryProgrammeAdminApi } from './api';
import { deliveryProgrammeAdminApiRef } from './api';
import { SnapshotFriendlyStylesProvider } from '../../utils';
import type * as PluginPermissionReactModule from '@backstage/plugin-permission-react';

function setup() {
  const mockAlertApi: jest.Mocked<AlertApi> = {
    alert$: jest.fn(),
    post: jest.fn(),
  };
  const mockProgrammeAdminApi: jest.Mocked<DeliveryProgrammeAdminApi> = {
    create: jest.fn(),
    delete: jest.fn(),
    getAll: jest.fn(),
    getByDeliveryProgrammeId: jest.fn(),
  };

  return {
    mockAlertApi,
    mockProgrammeAdminApi,
    async renderComponent(props: RemoveDeliveryProgrammeAdminButtonProps) {
      const result = render(
        <TestApiProvider
          apis={[
            [alertApiRef, mockAlertApi],
            [deliveryProgrammeAdminApiRef, mockProgrammeAdminApi],
          ]}
        >
          <SnapshotFriendlyStylesProvider>
            <RemoveDeliveryProgrammeAdminButton {...props} />
          </SnapshotFriendlyStylesProvider>
        </TestApiProvider>,
      );
      await waitFor(() => expect(result.baseElement).not.toBeEmptyDOMElement());
      return { result };
    },
  };
}

const deliveryProgrammeAdmin = {
  aad_entity_ref_id: '123',
  delivery_programme_id: '123',
  email: `test-programme-admin@test.com`,
  id: '123',
  name: 'Test Delivery Programme Admin',
  updated_at: new Date(0),
};

const usePermission: jest.MockedFn<
  typeof PluginPermissionReactModule.usePermission
> = jest.fn();

jest.mock(
  '@backstage/plugin-permission-react',
  () =>
    ({
      get usePermission() {
        return usePermission;
      },
      get IdentityPermissionApi(): never {
        throw new Error('Not mocked');
      },
      get PermissionedRoute(): never {
        throw new Error('Not mocked');
      },
      get RequirePermission(): never {
        throw new Error('Not mocked');
      },
      get permissionApiRef(): never {
        throw new Error('Not mocked');
      },
    }) satisfies typeof PluginPermissionReactModule,
);

describe('RemoveDeliveryProgrammeAdminButton', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when the user is not allowed to remove delivery programme admins', async () => {
    const { mockAlertApi, mockProgrammeAdminApi, renderComponent } = setup();
    usePermission.mockReturnValue({ allowed: false, loading: false });

    const { result } = await renderComponent({
      content: 'Test button',
      deliveryProgrammeAdmin: deliveryProgrammeAdmin,
      entityRef: 'programme-group-123',
    });

    expect(result.baseElement).toMatchSnapshot();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
    expect(mockProgrammeAdminApi.create).not.toHaveBeenCalled();
    expect(mockProgrammeAdminApi.delete).not.toHaveBeenCalled();
    expect(mockProgrammeAdminApi.getAll).not.toHaveBeenCalled();
    expect(
      mockProgrammeAdminApi.getByDeliveryProgrammeId,
    ).not.toHaveBeenCalled();
  });

  it('should only render a button initially', async () => {
    const { renderComponent, mockAlertApi, mockProgrammeAdminApi } = setup();
    usePermission.mockReturnValue({ allowed: true, loading: false });

    const { result } = await renderComponent({
      content: 'Test button',
      deliveryProgrammeAdmin: deliveryProgrammeAdmin,
      entityRef: 'programme-group-123',
    });

    expect(result.baseElement).toMatchSnapshot();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
    expect(mockProgrammeAdminApi.create).not.toHaveBeenCalled();
    expect(mockProgrammeAdminApi.delete).not.toHaveBeenCalled();
    expect(mockProgrammeAdminApi.getAll).not.toHaveBeenCalled();
    expect(
      mockProgrammeAdminApi.getByDeliveryProgrammeId,
    ).not.toHaveBeenCalled();
  });
});
