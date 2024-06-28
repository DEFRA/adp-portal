import React from 'react';
import { alertApiRef, type AlertApi } from '@backstage/core-plugin-api';
import { deliveryProjectUserApiRef, type DeliveryProjectUserApi } from './api';
import { render, waitFor } from '@testing-library/react';
import type { AddProjectUserButtonProps } from './AddProjectUserButton';
import { AddProjectUserButton } from './AddProjectUserButton';
import { TestApiProvider } from '@backstage/test-utils';
import {
  DeliveryProjectUserFormFields,
  emptyForm,
  type DeliveryProjectUserFields,
} from './DeliveryProjectUserFormFields';
import type * as DialogFormModule from '../../utils/DialogForm';
import userEvent from '@testing-library/user-event';
import type { ValidationError as IValidationError } from '@internal/plugin-adp-common';
import { ValidationError, type checkUsernameIsReserved } from '../../utils';
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
    async renderComponent(props: AddProjectUserButtonProps) {
      const result = render(
        <TestApiProvider
          apis={[
            [alertApiRef, mockAlertApi],
            [deliveryProjectUserApiRef, mockProjectUserApi],
          ]}
        >
          <AddProjectUserButton {...props} />
        </TestApiProvider>,
      );
      await waitFor(() => expect(result.baseElement).not.toBeEmptyDOMElement());
      return { result };
    },
  };
}

const fields: DeliveryProjectUserFields = {
  user_catalog_name: { label: 'user-1234', value: 'user-1234' },
  github_username: 'user-1234',
  is_admin: false,
  is_technical: true,
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

describe('AddProjectUserButton', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when the user is not allowed to create delivery projects', async () => {
    const { mockAlertApi, mockProjectUserApi, renderComponent } = setup();
    usePermission.mockReturnValue({ allowed: false, loading: false });

    const { result } = await renderComponent({
      content: 'Test button',
      deliveryProjectId: '123',
      entityRef: 'programme-group-123',
    });

    expect(result.baseElement).toMatchSnapshot();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
    expect(mockProjectUserApi.create).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getAll).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getByDeliveryProjectId).not.toHaveBeenCalled();
  });

  it('should only render a button initially', async () => {
    const { renderComponent, mockAlertApi, mockProjectUserApi } = setup();
    usePermission.mockReturnValue({ allowed: true, loading: false });

    const { result } = await renderComponent({
      content: 'Test button',
      deliveryProjectId: '123',
      entityRef: 'project-123',
    });

    expect(result.baseElement).toMatchSnapshot();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
    expect(mockProjectUserApi.create).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getAll).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getByDeliveryProjectId).not.toHaveBeenCalled();
  });

  it('should render the dialog when the button is clicked', async () => {
    const { renderComponent, mockAlertApi, mockProjectUserApi } = setup();
    DialogForm.mockReturnValue(<span>Test dialog</span>);

    const { result } = await renderComponent({
      content: 'Test button',
      deliveryProjectId: '123',
      entityRef: 'project-123',
    });
    await userEvent.click(result.getByTestId('add-project-user-button'));

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
      confirm: 'Add',
      cancel: undefined,
      defaultValues: emptyForm,
      disabled: undefined,
      validate: undefined,
    });
    expect(formProps.submit).toBeDefined();
    expect(formProps.completed).toBeDefined();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
    expect(mockProjectUserApi.create).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getAll).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getByDeliveryProjectId).not.toHaveBeenCalled();
  });

  it('should close the dialog when the form is cancelled', async () => {
    const { renderComponent, mockAlertApi, mockProjectUserApi } = setup();
    DialogForm.mockReturnValue(<span>Test dialog</span>);

    const { result } = await renderComponent({
      content: 'Test button',
      deliveryProjectId: '123',
      entityRef: 'project-123',
    });
    await userEvent.click(result.getByTestId('add-project-user-button'));

    expect(result.baseElement).toMatchSnapshot('Before cancel');
    expect(DialogForm.mock.calls).toHaveLength(1);
    const formProps = DialogForm.mock.calls[0][0];
    React.act(() => formProps.completed(undefined));
    await waitFor(() => expect(result.queryByText('Test dialog')).toBeNull());
    expect(result.baseElement).toMatchSnapshot('After cancel');
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
    expect(mockProjectUserApi.create).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getAll).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getByDeliveryProjectId).not.toHaveBeenCalled();
  });

  it('should call onCreated when the form closes with a value', async () => {
    const { renderComponent, mockAlertApi, mockProjectUserApi } = setup();
    DialogForm.mockReturnValue(<span>Test dialog</span>);
    const onCreated: jest.MockedFn<
      Exclude<AddProjectUserButtonProps['onCreated'], undefined>
    > = jest.fn();

    const { result } = await renderComponent({
      content: 'Test button',
      deliveryProjectId: '123',
      entityRef: 'project-123',
      onCreated,
    });
    await userEvent.click(result.getByTestId('add-project-user-button'));

    expect(result.baseElement).toMatchSnapshot('Before complete');
    expect(DialogForm.mock.calls).toHaveLength(1);
    expect(onCreated).not.toHaveBeenCalled();
    const formProps = DialogForm.mock.calls[0][0];
    React.act(() => formProps.completed(fields));
    await waitFor(() => expect(result.queryByText('Test dialog')).toBeNull());
    expect(result.baseElement).toMatchSnapshot('After complete');
    expect(onCreated).toHaveBeenCalledTimes(1);
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
    expect(mockProjectUserApi.create).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getAll).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getByDeliveryProjectId).not.toHaveBeenCalled();
  });

  it('should call the API when submitting', async () => {
    const { renderComponent, mockAlertApi, mockProjectUserApi } = setup();
    DialogForm.mockReturnValue(<span>Test dialog</span>);

    const { result } = await renderComponent({
      content: 'Test button',
      deliveryProjectId: 'project-1',
      entityRef: 'project-123',
    });
    await userEvent.click(result.getByTestId('add-project-user-button'));

    expect(result.baseElement).toMatchSnapshot();
    expect(DialogForm.mock.calls).toHaveLength(1);
    const formProps = DialogForm.mock.calls[0][0];
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
    expect(mockProjectUserApi.create).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getAll).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getByDeliveryProjectId).not.toHaveBeenCalled();

    const submitResult = await formProps.submit(fields);
    expect(submitResult).toMatchObject({ type: 'success' });
    expect(mockProjectUserApi.create.mock.calls).toMatchObject([
      [
        {
          delivery_project_id: 'project-1',
          github_username: 'user-1234',
          is_admin: false,
          is_technical: true,
          user_catalog_name: 'user-1234',
        },
      ],
    ]);
    expect(mockProjectUserApi.getAll).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getByDeliveryProjectId).not.toHaveBeenCalled();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post.mock.calls).toMatchObject([
      [
        {
          message: 'Delivery Project User added successfully',
          severity: 'success',
          display: 'transient',
        },
      ],
    ]);
  });

  it('should catch validation errors when submitting', async () => {
    const { renderComponent, mockAlertApi, mockProjectUserApi } = setup();
    DialogForm.mockReturnValue(<span>Test dialog</span>);
    const validationErrors: IValidationError[] = [
      {
        path: 'abc',
        error: {
          message: 'Something broke',
        },
      },
    ];
    mockProjectUserApi.create.mockRejectedValueOnce(
      new ValidationError(validationErrors),
    );

    const { result } = await renderComponent({
      content: 'Test button',
      deliveryProjectId: 'project-2',
      entityRef: 'project-123',
    });
    await userEvent.click(result.getByTestId('add-project-user-button'));

    expect(result.baseElement).toMatchSnapshot();
    expect(DialogForm.mock.calls).toHaveLength(1);
    const formProps = DialogForm.mock.calls[0][0];
    expect(mockProjectUserApi.create).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getAll).not.toHaveBeenCalled();
    expect(mockProjectUserApi.getByDeliveryProjectId).not.toHaveBeenCalled();

    const submitResult = await formProps.submit(fields);
    expect(submitResult).toMatchObject({
      type: 'validationError',
      errors: validationErrors,
    });
    expect(mockProjectUserApi.create.mock.calls).toMatchObject([
      [
        {
          delivery_project_id: 'project-2',
          github_username: 'user-1234',
          is_admin: false,
          is_technical: true,
          user_catalog_name: 'user-1234',
        },
      ],
    ]);
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
      content: 'Test button',
      deliveryProjectId: 'project-2',
      entityRef: 'project-123',
    });
    await userEvent.click(result.getByTestId('add-project-user-button'));

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
