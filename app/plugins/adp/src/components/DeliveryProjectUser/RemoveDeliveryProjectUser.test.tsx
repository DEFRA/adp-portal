import type { AlertApi } from '@backstage/core-plugin-api';
import { alertApiRef } from '@backstage/core-plugin-api';
import React from 'react';
import type { DeliveryProjectUserApi } from './api';
import { deliveryProjectUserApiRef } from './api';
import type { RemoveDeliveryProjectUserButtonProps } from './RemoveDeliveryProjectUserButton';
import { RemoveDeliveryProjectUserButton } from './RemoveDeliveryProjectUserButton';
import { render, waitFor } from '@testing-library/react';
import { TestApiProvider } from '@backstage/test-utils';
import { SnapshotFriendlyStylesProvider } from '../../utils';
import type { DeliveryProjectUser } from '@internal/plugin-adp-common';
import type * as PluginPermissionReactModule from '@backstage/plugin-permission-react';
import type * as ConfirmationDialogModule from '../../utils/ConfirmationDialog';
import userEvent from '@testing-library/user-event';

function setup() {
  const mockAlertApi: jest.Mocked<AlertApi> = {
    alert$: jest.fn(),
    post: jest.fn(),
  };
  const mockProjectUserApi: jest.Mocked<DeliveryProjectUserApi> = {
    create: jest.fn(),
    delete: jest.fn(),
    getAll: jest.fn(),
    getByDeliveryProjectId: jest.fn(),
    update: jest.fn(),
  };

  return {
    mockAlertApi,
    mockProjectUserApi,
    async renderComponent(props: RemoveDeliveryProjectUserButtonProps) {
      const result = render(
        <TestApiProvider
          apis={[
            [alertApiRef, mockAlertApi],
            [deliveryProjectUserApiRef, mockProjectUserApi],
          ]}
        >
          <SnapshotFriendlyStylesProvider>
            <RemoveDeliveryProjectUserButton {...props} />
          </SnapshotFriendlyStylesProvider>
        </TestApiProvider>,
      );
      await waitFor(() => expect(result.baseElement).not.toBeEmptyDOMElement());
      return { result };
    },
  };
}

const deliveryProjectUser: DeliveryProjectUser = {
  aad_entity_ref_id: 'cffdf0da-48b9-40d0-a519-d5d818b10a84',
  delivery_project_id: 'da61ccb1-95f7-4cff-9b75-28e3aec63e4b',
  email: 'test@test.com',
  id: '896061ec-58dd-468f-bfbc-c35ccb177f36',
  is_admin: true,
  is_technical: false,
  name: 'test user',
  updated_at: new Date(),
  github_username: 'test_user',
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

describe('RemoveDeliveryProjectUserButton', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when the user is not allowed to remove delivery project users', async () => {
    const { mockAlertApi, mockProjectUserApi, renderComponent } = setup();
    usePermission.mockReturnValue({ allowed: false, loading: false });

    const { result } = await renderComponent({
      content: 'Test button',
      deliveryProjectUser: deliveryProjectUser,
    });

    expect(result.baseElement).toMatchSnapshot();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
    expect(mockProjectUserApi.create).not.toHaveBeenCalled();
    expect(mockProjectUserApi.delete).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getAll).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getByDeliveryProjectId).not.toHaveBeenCalled();
    expect(mockProjectUserApi.update).not.toHaveBeenCalled();
  });

  it('should only render a button initially', async () => {
    const { renderComponent, mockAlertApi, mockProjectUserApi } = setup();
    usePermission.mockReturnValue({ allowed: true, loading: false });

    const { result } = await renderComponent({
      content: 'Test button',
      deliveryProjectUser: deliveryProjectUser,
    });

    expect(result.baseElement).toMatchSnapshot();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
    expect(mockProjectUserApi.create).not.toHaveBeenCalled();
    expect(mockProjectUserApi.delete).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getAll).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getByDeliveryProjectId).not.toHaveBeenCalled();
    expect(mockProjectUserApi.update).not.toHaveBeenCalled();
  });

  it('should render the dialog when the button is clicked', async () => {
    const { renderComponent, mockAlertApi, mockProjectUserApi } = setup();
    ConfirmationDialog.mockReturnValue(<span>Test dialog</span>);
    usePermission.mockReturnValue({ allowed: true, loading: false });

    const { result } = await renderComponent({
      content: 'Test button',
      deliveryProjectUser: deliveryProjectUser,
    });
    await userEvent.click(
      result.getByTestId('remove-delivery-project-user-button'),
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
      title: `Remove ${deliveryProjectUser.name}?`,
      content:
        'Are you sure you want to remove this user? The user will no longer be able to perform certain actions on the ADP portal. You can re-add the user after removing them.',
      confirm: 'Remove',
      cancel: undefined,
    });
    expect(formProps.submit).toBeDefined();
    expect(formProps.completed).toBeDefined();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
    expect(mockProjectUserApi.create).not.toHaveBeenCalled();
    expect(mockProjectUserApi.delete).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getAll).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getByDeliveryProjectId).not.toHaveBeenCalled();
    expect(mockProjectUserApi.update).not.toHaveBeenCalled();
  });

  it('should close the dialog via the Cancel action', async () => {
    const { renderComponent, mockAlertApi, mockProjectUserApi } = setup();
    ConfirmationDialog.mockReturnValue(<span>Test dialog</span>);
    usePermission.mockReturnValue({ allowed: true, loading: false });

    const { result } = await renderComponent({
      content: 'Test button',
      deliveryProjectUser: deliveryProjectUser,
    });
    await userEvent.click(
      result.getByTestId('remove-delivery-project-user-button'),
    );

    expect(result.baseElement).toMatchSnapshot('Before cancel');
    expect(ConfirmationDialog.mock.calls).toHaveLength(1);
    const formProps = ConfirmationDialog.mock.calls[0][0];
    React.act(() => formProps.completed(undefined));
    await waitFor(() => expect(result.queryByText('Test dialog')).toBeNull());
    expect(result.baseElement).toMatchSnapshot('After cancel');
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
    expect(mockProjectUserApi.create).not.toHaveBeenCalled();
    expect(mockProjectUserApi.delete).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getAll).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getByDeliveryProjectId).not.toHaveBeenCalled();
    expect(mockProjectUserApi.update).not.toHaveBeenCalled();
  });

  it('should call onRemoved when the dialog is closed via the Remove action', async () => {
    const { renderComponent, mockAlertApi, mockProjectUserApi } = setup();
    ConfirmationDialog.mockReturnValue(<span>Test dialog</span>);
    usePermission.mockReturnValue({ allowed: true, loading: false });
    const onRemoved: jest.MockedFn<
      Exclude<RemoveDeliveryProjectUserButtonProps['onRemoved'], undefined>
    > = jest.fn();

    const { result } = await renderComponent({
      content: 'Test button',
      deliveryProjectUser: deliveryProjectUser,
      onRemoved,
    });
    await userEvent.click(
      result.getByTestId('remove-delivery-project-user-button'),
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
    expect(mockProjectUserApi.create).not.toHaveBeenCalled();
    expect(mockProjectUserApi.delete).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getAll).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getByDeliveryProjectId).not.toHaveBeenCalled();
    expect(mockProjectUserApi.update).not.toHaveBeenCalled();
  });

  it('should call the API when submitting', async () => {
    const { renderComponent, mockAlertApi, mockProjectUserApi } = setup();
    ConfirmationDialog.mockReturnValue(<span>Test dialog</span>);
    usePermission.mockReturnValue({ allowed: true, loading: false });

    const { result } = await renderComponent({
      content: 'Test button',
      deliveryProjectUser: deliveryProjectUser,
    });
    await userEvent.click(
      result.getByTestId('remove-delivery-project-user-button'),
    );

    expect(result.baseElement).toMatchSnapshot();
    expect(ConfirmationDialog.mock.calls).toHaveLength(1);
    const formProps = ConfirmationDialog.mock.calls[0][0];
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
    expect(mockProjectUserApi.create).not.toHaveBeenCalled();
    expect(mockProjectUserApi.delete).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getAll).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getByDeliveryProjectId).not.toHaveBeenCalled();
    expect(mockProjectUserApi.update).not.toHaveBeenCalled();

    await formProps.submit();
    expect(mockProjectUserApi.create).not.toHaveBeenCalled();
    expect(mockProjectUserApi.delete.mock.calls).toMatchObject([
      [deliveryProjectUser.id, deliveryProjectUser.delivery_project_id],
    ]);
    expect(mockProjectUserApi.getAll).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getByDeliveryProjectId).not.toHaveBeenCalled();
    expect(mockProjectUserApi.update).not.toHaveBeenCalled();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post.mock.calls).toMatchObject([
      [
        {
          message: `Removed ${deliveryProjectUser.name} from this delivery project`,
          severity: 'success',
          display: 'transient',
        },
      ],
    ]);
  });
});
