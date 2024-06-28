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
import type * as ConfirmationDialogModule from '../../utils/ConfirmationDialog';
import userEvent from '@testing-library/user-event';

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
const ConfirmationDialog: jest.MockedFn<
  typeof ConfirmationDialogModule.ConfirmationDialog
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

jest.mock(
  '../../utils/ConfirmationDialog',
  () =>
    ({
      get ConfirmationDialog() {
        return ConfirmationDialog as typeof ConfirmationDialogModule.ConfirmationDialog;
      },
    }) satisfies typeof ConfirmationDialogModule,
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

  it('should render the dialog when the button is clicked', async () => {
    const { renderComponent, mockAlertApi, mockProgrammeAdminApi } = setup();
    ConfirmationDialog.mockReturnValue(<span>Test dialog</span>);
    usePermission.mockReturnValue({ allowed: true, loading: false });

    const { result } = await renderComponent({
      content: 'Test button',
      deliveryProgrammeAdmin: deliveryProgrammeAdmin,
      entityRef: 'programme-group-123',
    });
    await userEvent.click(
      result.getByTestId('remove-delivery-programme-admin-button'),
    );

    expect(result.baseElement).toMatchSnapshot();
    expect(ConfirmationDialog.mock.calls).toHaveLength(1);
    const formProps = ConfirmationDialog.mock.calls[0][0];
    expect({
      open: formProps.open,
      title: formProps.title,
      content: formProps.content,
      confirm: formProps.confirm,
      cancel: formProps.cancel,
    }).toMatchObject({
      open: undefined,
      title: `Remove ${deliveryProgrammeAdmin.name}?`,
      content:
        'Are you sure you want to remove this user? The user will no longer be able to perform certain actions on the ADP portal. You can re-add the user after removing them.',
      confirm: 'Remove',
      cancel: undefined,
    });
    expect(formProps.submit).toBeDefined();
    expect(formProps.completed).toBeDefined();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
    expect(mockProgrammeAdminApi.create).not.toHaveBeenCalled();
    expect(mockProgrammeAdminApi.delete).not.toHaveBeenCalled();
    expect(mockProgrammeAdminApi.getAll).not.toHaveBeenCalled();
    expect(
      mockProgrammeAdminApi.getByDeliveryProgrammeId,
    ).not.toHaveBeenCalled();
  });

  it('should close the dialog via the Cancel action', async () => {
    const { renderComponent, mockAlertApi, mockProgrammeAdminApi } = setup();
    ConfirmationDialog.mockReturnValue(<span>Test dialog</span>);
    usePermission.mockReturnValue({ allowed: true, loading: false });

    const { result } = await renderComponent({
      content: 'Test button',
      deliveryProgrammeAdmin: deliveryProgrammeAdmin,
      entityRef: 'programme-group-123',
    });
    await userEvent.click(
      result.getByTestId('remove-delivery-programme-admin-button'),
    );

    expect(result.baseElement).toMatchSnapshot('Before cancel');
    expect(ConfirmationDialog.mock.calls).toHaveLength(1);
    const formProps = ConfirmationDialog.mock.calls[0][0];
    React.act(() => formProps.completed(undefined));
    await waitFor(() => expect(result.queryByText('Test dialog')).toBeNull());
    expect(result.baseElement).toMatchSnapshot('After cancel');
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
    expect(mockProgrammeAdminApi.create).not.toHaveBeenCalled();
    expect(mockProgrammeAdminApi.delete).not.toHaveBeenCalled();
    expect(mockProgrammeAdminApi.getAll).not.toHaveBeenCalled();
    expect(
      mockProgrammeAdminApi.getByDeliveryProgrammeId,
    ).not.toHaveBeenCalled();
  });

  it('should call onRemoved when the dialog is closed via the Remove action', async () => {
    const { renderComponent, mockAlertApi, mockProgrammeAdminApi } = setup();
    ConfirmationDialog.mockReturnValue(<span>Test dialog</span>);
    usePermission.mockReturnValue({ allowed: true, loading: false });
    const onRemoved: jest.MockedFn<
      Exclude<RemoveDeliveryProgrammeAdminButtonProps['onRemoved'], undefined>
    > = jest.fn();

    const { result } = await renderComponent({
      content: 'Test button',
      deliveryProgrammeAdmin: deliveryProgrammeAdmin,
      entityRef: 'programme-group-123',
      onRemoved,
    });
    await userEvent.click(
      result.getByTestId('remove-delivery-programme-admin-button'),
    );

    expect(result.baseElement).toMatchSnapshot('Before complete');
    expect(ConfirmationDialog.mock.calls).toHaveLength(1);
    expect(onRemoved).not.toHaveBeenCalled();
    const formProps = ConfirmationDialog.mock.calls[0][0];
    React.act(() => formProps.completed(true));
    await waitFor(() => expect(result.queryByText('Test dialog')).toBeNull());
    expect(result.baseElement).toMatchSnapshot('After complete');
    expect(onRemoved).toHaveBeenCalledTimes(1);
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
    expect(mockProgrammeAdminApi.create).not.toHaveBeenCalled();
    expect(mockProgrammeAdminApi.delete).not.toHaveBeenCalled();
    expect(mockProgrammeAdminApi.getAll).not.toHaveBeenCalled();
    expect(
      mockProgrammeAdminApi.getByDeliveryProgrammeId,
    ).not.toHaveBeenCalled();
  });

  it('should call the API when submitting', async () => {
    const { renderComponent, mockAlertApi, mockProgrammeAdminApi } = setup();
    ConfirmationDialog.mockReturnValue(<span>Test dialog</span>);
    usePermission.mockReturnValue({ allowed: true, loading: false });

    const { result } = await renderComponent({
      content: 'Test button',
      deliveryProgrammeAdmin: deliveryProgrammeAdmin,
      entityRef: 'programme-group-123',
    });
    await userEvent.click(
      result.getByTestId('remove-delivery-programme-admin-button'),
    );

    expect(result.baseElement).toMatchSnapshot();
    expect(ConfirmationDialog.mock.calls).toHaveLength(1);
    const formProps = ConfirmationDialog.mock.calls[0][0];
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
    expect(mockProgrammeAdminApi.create).not.toHaveBeenCalled();
    expect(mockProgrammeAdminApi.delete).not.toHaveBeenCalled();
    expect(mockProgrammeAdminApi.getAll).not.toHaveBeenCalled();
    expect(
      mockProgrammeAdminApi.getByDeliveryProgrammeId,
    ).not.toHaveBeenCalled();

    await formProps.submit();
    expect(mockProgrammeAdminApi.create).not.toHaveBeenCalled();
    expect(mockProgrammeAdminApi.delete.mock.calls).toMatchObject([
      [deliveryProgrammeAdmin.id, 'programme-group-123'],
    ]);
    expect(mockProgrammeAdminApi.getAll).not.toHaveBeenCalled();
    expect(
      mockProgrammeAdminApi.getByDeliveryProgrammeId,
    ).not.toHaveBeenCalled();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post.mock.calls).toMatchObject([
      [
        {
          message: `Removed ${deliveryProgrammeAdmin.name} from this delivery programme`,
          severity: 'success',
          display: 'transient',
        },
      ],
    ]);
  });
});
