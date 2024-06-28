import React from 'react';
import type {
  DeliveryProjectUser,
  ValidationError as IValidationError,
} from '@internal/plugin-adp-common';
import {
  DeliveryProjectUserFormFields,
  type DeliveryProjectUserFields,
} from './DeliveryProjectUserFormFields';
import type * as DialogFormModule from '../../utils/DialogForm';
import { alertApiRef, type AlertApi } from '@backstage/core-plugin-api';
import { deliveryProjectUserApiRef, type DeliveryProjectUserApi } from './api';
import type { EditDeliveryProjectUserButtonProps } from './EditDeliveryProjectUserButton';
import { EditDeliveryProjectUserButton } from './EditDeliveryProjectUserButton';
import { render, waitFor } from '@testing-library/react';
import { TestApiProvider } from '@backstage/test-utils';
import userEvent from '@testing-library/user-event';
import { SnapshotFriendlyStylesProvider, ValidationError } from '../../utils';
import { type checkUsernameIsReserved } from '../../utils/reservedUsernames';
import type * as PluginPermissionReactModule from '@backstage/plugin-permission-react';

function setup() {
  const mockAlertApi: jest.Mocked<AlertApi> = {
    alert$: jest.fn(),
    post: jest.fn(),
  };
  const mockProjectUserApi: jest.Mocked<DeliveryProjectUserApi> = {
    create: jest.fn(),
    getAll: jest.fn(),
    getByDeliveryProjectId: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  return {
    mockAlertApi,
    mockProjectUserApi,
    async renderComponent(props: EditDeliveryProjectUserButtonProps) {
      const result = render(
        <TestApiProvider
          apis={[
            [alertApiRef, mockAlertApi],
            [deliveryProjectUserApiRef, mockProjectUserApi],
          ]}
        >
          <SnapshotFriendlyStylesProvider>
            <EditDeliveryProjectUserButton {...props} />
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

const fields: DeliveryProjectUserFields = {
  github_username: 'test_user',
  is_admin: false,
  is_technical: true,
  user_catalog_name: { label: 'test@test.com', value: 'test@test.com' },
};

const usePermission: jest.MockedFn<
  typeof PluginPermissionReactModule.usePermission
> = jest.fn();
const DialogForm: jest.MockedFn<typeof DialogFormModule.DialogForm> = jest.fn();

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
  '../../utils/DialogForm',
  () =>
    ({
      get DialogForm() {
        return DialogForm as typeof DialogFormModule.DialogForm;
      },
    }) satisfies typeof DialogFormModule,
);

const mockCheckUsernameIsReserved: jest.MockedFn<
  typeof checkUsernameIsReserved
> = jest.fn().mockReturnValue(false);
jest.mock('../../utils/reservedUsernames', () => ({
  get checkUsernameIsReserved() {
    return mockCheckUsernameIsReserved;
  },
}));

describe('EditDeliveryProjectUserButton', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when the user is not allowed to edit delivery projects', async () => {
    const { mockAlertApi, mockProjectUserApi, renderComponent } = setup();
    usePermission.mockReturnValue({ allowed: false, loading: false });

    const { result } = await renderComponent({
      content: 'My button',
      deliveryProjectUser,
    });

    expect(result.baseElement).toMatchSnapshot();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
    expect(mockProjectUserApi.create).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getAll).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getByDeliveryProjectId).not.toHaveBeenCalled();
  });

  it('Should render the dialog when the button is clicked', async () => {
    const { mockAlertApi, mockProjectUserApi, renderComponent } = setup();
    DialogForm.mockReturnValue(<span>This is a dialog!</span>);
    usePermission.mockReturnValue({ allowed: true, loading: false });

    const { result } = await renderComponent({
      content: 'My button',
      deliveryProjectUser,
    });
    await userEvent.click(
      result.getByTestId('edit-delivery-project-user-button'),
    );

    expect(result.baseElement).toMatchSnapshot();
    expect(DialogForm.mock.calls).toHaveLength(1);
    const formProps = DialogForm.mock.calls[0][0];
    expect({
      open: formProps.open,
      renderFields: formProps.renderFields,
      confirm: formProps.confirm,
      cancel: formProps.cancel,
      defaultValues: formProps.defaultValues,
      disabled: formProps.disabled,
      validate: formProps.validate,
    }).toMatchObject({
      open: undefined,
      renderFields: DeliveryProjectUserFormFields,
      confirm: 'Update',
      cancel: undefined,
      defaultValues: {
        is_technical: deliveryProjectUser.is_technical,
        is_admin: deliveryProjectUser.is_admin,
        github_username: deliveryProjectUser.github_username,
      },
      disabled: {
        user_catalog_name: true,
      },
      validate: undefined,
    });
    expect(formProps.submit).toBeDefined();
    expect(formProps.completed).toBeDefined();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
    expect(mockProjectUserApi.create).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getAll).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getByDeliveryProjectId).not.toHaveBeenCalled();
    expect(mockProjectUserApi.update).not.toHaveBeenCalled();
  });

  it('Should close the form when the form is cancelled.', async () => {
    const { mockAlertApi, mockProjectUserApi, renderComponent } = setup();
    DialogForm.mockReturnValue(<span>This is a dialog!</span>);
    usePermission.mockReturnValue({ allowed: true, loading: false });

    const { result } = await renderComponent({
      content: 'My button',
      deliveryProjectUser,
    });
    await userEvent.click(
      result.getByTestId('edit-delivery-project-user-button'),
    );

    expect(result.baseElement).toMatchSnapshot('Before cancel');
    expect(DialogForm.mock.calls).toHaveLength(1);
    const formProps = DialogForm.mock.calls[0][0];
    React.act(() => formProps.completed(undefined));
    await waitFor(() =>
      expect(result.queryByText('This is a dialog!')).toBeNull(),
    );
    expect(result.baseElement).toMatchSnapshot('After cancel');
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
    expect(mockProjectUserApi.create).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getAll).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getByDeliveryProjectId).not.toHaveBeenCalled();
    expect(mockProjectUserApi.update).not.toHaveBeenCalled();
  });

  it('Should call onEdited when the form closes with a value.', async () => {
    const { mockAlertApi, mockProjectUserApi, renderComponent } = setup();
    DialogForm.mockReturnValue(<span>This is a dialog!</span>);
    const onEdited: jest.MockedFn<
      Exclude<EditDeliveryProjectUserButtonProps['onEdited'], undefined>
    > = jest.fn();
    usePermission.mockReturnValue({ allowed: true, loading: false });

    const { result } = await renderComponent({
      content: 'My button',
      deliveryProjectUser,
      onEdited,
    });
    await userEvent.click(
      result.getByTestId('edit-delivery-project-user-button'),
    );

    expect(result.baseElement).toMatchSnapshot('Before complete');
    expect(DialogForm.mock.calls).toHaveLength(1);
    expect(onEdited).not.toHaveBeenCalled();
    const formProps = DialogForm.mock.calls[0][0];
    React.act(() => formProps.completed(fields));
    await waitFor(() =>
      expect(result.queryByText('This is a dialog!')).toBeNull(),
    );
    expect(result.baseElement).toMatchSnapshot('After complete');
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
    expect(onEdited).toHaveBeenCalledTimes(1);
    expect(mockProjectUserApi.create).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getAll).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getByDeliveryProjectId).not.toHaveBeenCalled();
    expect(mockProjectUserApi.update).not.toHaveBeenCalled();
  });

  it('Should call the api when submitting.', async () => {
    const { mockAlertApi, mockProjectUserApi, renderComponent } = setup();
    DialogForm.mockReturnValue(<span>This is a dialog!</span>);
    usePermission.mockReturnValue({ allowed: true, loading: false });

    const { result } = await renderComponent({
      content: 'My button',
      deliveryProjectUser,
    });
    await userEvent.click(
      result.getByTestId('edit-delivery-project-user-button'),
    );

    expect(result.baseElement).toMatchSnapshot();
    expect(DialogForm.mock.calls).toHaveLength(1);
    const formProps = DialogForm.mock.calls[0][0];
    expect(mockProjectUserApi.create).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getAll).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getByDeliveryProjectId).not.toHaveBeenCalled();
    expect(mockProjectUserApi.update).not.toHaveBeenCalled();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();

    const submitResult = await formProps.submit(fields);
    expect(submitResult).toMatchObject({ type: 'success' });
    expect(mockProjectUserApi.update.mock.calls).toMatchObject([
      [{ ...fields, user_catalog_name: fields.user_catalog_name.value }],
    ]);
    expect(mockProjectUserApi.create).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getAll).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getByDeliveryProjectId).not.toHaveBeenCalled();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post.mock.calls).toMatchObject([
      [
        {
          message: 'Delivery Project User updated successfully.',
          severity: 'success',
          display: 'transient',
        },
      ],
    ]);
  });

  it('Should catch ValidationErrors when submitting.', async () => {
    const { mockAlertApi, mockProjectUserApi, renderComponent } = setup();
    DialogForm.mockReturnValue(<span>This is a dialog!</span>);
    usePermission.mockReturnValue({ allowed: true, loading: false });
    const validationErrors: IValidationError[] = [
      {
        path: 'abc',
        error: {
          message: '123',
        },
      },
    ];
    mockProjectUserApi.update.mockRejectedValueOnce(
      new ValidationError(validationErrors),
    );

    const { result } = await renderComponent({
      content: 'My button',
      deliveryProjectUser,
    });
    await userEvent.click(
      result.getByTestId('edit-delivery-project-user-button'),
    );

    expect(result.baseElement).toMatchSnapshot();
    expect(DialogForm.mock.calls).toHaveLength(1);
    const formProps = DialogForm.mock.calls[0][0];
    expect(mockProjectUserApi.create).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getAll).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getByDeliveryProjectId).not.toHaveBeenCalled();
    expect(mockProjectUserApi.update).not.toHaveBeenCalled();

    const submitResult = await formProps.submit(fields);
    expect(submitResult).toMatchObject({
      type: 'validationError',
      errors: validationErrors,
    });
    expect(mockProjectUserApi.update.mock.calls).toMatchObject([
      [{ ...fields, user_catalog_name: fields.user_catalog_name.value }],
    ]);
    expect(mockProjectUserApi.create).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getAll).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getByDeliveryProjectId).not.toHaveBeenCalled();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
  });

  it('Should catch github handle validation error when submitting.', async () => {
    const { renderComponent } = setup();
    DialogForm.mockReturnValue(<span>This is a dialog!</span>);
    usePermission.mockReturnValue({ allowed: true, loading: false });
    mockCheckUsernameIsReserved.mockReturnValue(true);
    const validationErrors: IValidationError[] = [
      {
        path: 'github_username',
        error: {
          message:
            'Please enter a valid GitHub handle. This Github handle is reserved.',
        },
      },
    ];

    const { result } = await renderComponent({
      content: 'My button',
      deliveryProjectUser,
    });
    await userEvent.click(
      result.getByTestId('edit-delivery-project-user-button'),
    );

    expect(result.baseElement).toMatchSnapshot();
    expect(DialogForm.mock.calls).toHaveLength(1);
    const formProps = DialogForm.mock.calls[0][0];

    const submitResult = await formProps.submit(fields);
    expect(submitResult).toMatchObject({
      type: 'validationError',
      errors: validationErrors,
    });
  });
});
