import type { AlertApi } from '@backstage/core-plugin-api';
import { alertApiRef } from '@backstage/core-plugin-api';
import React from 'react';
import type { DeliveryProjectApi } from './api';
import { deliveryProjectApiRef } from './api';
import { render as testRender, waitFor } from '@testing-library/react';
import { TestApiProvider } from '@backstage/test-utils';
import type { CreateDeliveryProjectButtonProps } from './CreateDeliveryProjectButton';
import { CreateDeliveryProjectButton } from './CreateDeliveryProjectButton';
import userEvent from '@testing-library/user-event';
import type { DeliveryProjectFields } from './DeliveryProjectFormFields';
import {
  DeliveryProjectFormFields,
  emptyForm,
} from './DeliveryProjectFormFields';
import { act } from 'react-dom/test-utils';
import type { ValidationError as IValidationError } from '@internal/plugin-adp-common';
import { SnapshotFriendlyStylesProvider, ValidationError } from '../../utils';
import type * as PluginPermissionReactModule from '@backstage/plugin-permission-react';
import type * as DialogFormModule from '../../utils/DialogForm';

const usePermission: jest.MockedFn<
  typeof PluginPermissionReactModule.usePermission
> = jest.fn();
const DialogForm: jest.MockedFn<typeof DialogFormModule.DialogForm> = jest.fn();

const fields: DeliveryProjectFields = {
  ado_project: 'abc',
  delivery_programme_id: 'def',
  delivery_project_code: 'ghi',
  description: 'jkl',
  github_team_visibility: 'private',
  namespace: 'mno',
  service_owner: 'pqr',
  team_type: 'stu',
  title: 'vwx',
  alias: 'yz0',
  finance_code: '123',
};

beforeEach(() => {
  jest.resetAllMocks();
});

describe('CreateDeliveryProjectButton', () => {
  it('Should not render when the user is not allowed to create delivery projects', async () => {
    const { mockAlertApi, mockProjectApi, render } = setup();
    usePermission.mockReturnValue({ allowed: false, loading: false });

    const { result } = await render({ content: 'My button' });

    expect(result.baseElement).toMatchSnapshot();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
    expect(mockProjectApi.createDeliveryProject).not.toHaveBeenCalled();
    expect(mockProjectApi.getDeliveryProjectById).not.toHaveBeenCalled();
    expect(mockProjectApi.getDeliveryProjects).not.toHaveBeenCalled();
    expect(mockProjectApi.updateDeliveryProject).not.toHaveBeenCalled();
  });
  it('Should only render a button initially', async () => {
    const { mockAlertApi, mockProjectApi, render } = setup();
    usePermission.mockReturnValue({ allowed: true, loading: false });

    const { result } = await render({ content: 'My button' });

    expect(result.baseElement).toMatchSnapshot();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
    expect(mockProjectApi.createDeliveryProject).not.toHaveBeenCalled();
    expect(mockProjectApi.getDeliveryProjectById).not.toHaveBeenCalled();
    expect(mockProjectApi.getDeliveryProjects).not.toHaveBeenCalled();
    expect(mockProjectApi.updateDeliveryProject).not.toHaveBeenCalled();
  });
  it('Should render the dialog when the button is clicked', async () => {
    const { mockAlertApi, mockProjectApi, render } = setup();
    usePermission.mockReturnValue({ allowed: true, loading: false });
    DialogForm.mockReturnValue(<span>This is a dialog!</span>);

    const { result } = await render({ content: 'My button' });
    await userEvent.click(result.getByTestId('create-delivery-project-button'));

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
      renderFields: DeliveryProjectFormFields,
      confirm: 'Create',
      cancel: undefined,
      defaultValues: {
        ...emptyForm,
        github_team_visibility: 'public',
        team_type: 'delivery',
      },
      disabled: {
        namespace: true,
        team_type: true,
      },
      validate: undefined,
    });
    expect(formProps.submit).toBeDefined();
    expect(formProps.completed).toBeDefined();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
    expect(mockProjectApi.createDeliveryProject).not.toHaveBeenCalled();
    expect(mockProjectApi.getDeliveryProjectById).not.toHaveBeenCalled();
    expect(mockProjectApi.getDeliveryProjects).not.toHaveBeenCalled();
    expect(mockProjectApi.updateDeliveryProject).not.toHaveBeenCalled();
  });
  it('Should close the form when the form is cancelled.', async () => {
    const { mockAlertApi, mockProjectApi, render } = setup();
    usePermission.mockReturnValue({ allowed: true, loading: false });
    DialogForm.mockReturnValue(<span>This is a dialog!</span>);

    const { result } = await render({ content: 'My button' });
    await userEvent.click(result.getByTestId('create-delivery-project-button'));

    expect(result.baseElement).toMatchSnapshot('Before cancel');
    expect(DialogForm.mock.calls).toHaveLength(1);
    const formProps = DialogForm.mock.calls[0][0];
    act(() => formProps.completed(undefined));
    await waitFor(() =>
      expect(result.queryByText('This is a dialog!')).toBeNull(),
    );
    expect(result.baseElement).toMatchSnapshot('After cancel');
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
    expect(mockProjectApi.createDeliveryProject).not.toHaveBeenCalled();
    expect(mockProjectApi.getDeliveryProjectById).not.toHaveBeenCalled();
    expect(mockProjectApi.getDeliveryProjects).not.toHaveBeenCalled();
    expect(mockProjectApi.updateDeliveryProject).not.toHaveBeenCalled();
  });
  it('Should call onCreated when the form closes with a value.', async () => {
    const { mockAlertApi, mockProjectApi, render } = setup();
    usePermission.mockReturnValue({ allowed: true, loading: false });
    DialogForm.mockReturnValue(<span>This is a dialog!</span>);
    const onCreated: jest.MockedFn<
      Exclude<CreateDeliveryProjectButtonProps['onCreated'], undefined>
    > = jest.fn();

    const { result } = await render({ content: 'My button', onCreated });
    await userEvent.click(result.getByTestId('create-delivery-project-button'));

    expect(result.baseElement).toMatchSnapshot('Before complete');
    expect(DialogForm.mock.calls).toHaveLength(1);
    expect(onCreated).not.toHaveBeenCalled();
    const formProps = DialogForm.mock.calls[0][0];
    act(() => formProps.completed(fields));
    await waitFor(() =>
      expect(result.queryByText('This is a dialog!')).toBeNull(),
    );
    expect(result.baseElement).toMatchSnapshot('After complete');
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
    expect(onCreated).toHaveBeenCalledTimes(1);
    expect(mockProjectApi.createDeliveryProject).not.toHaveBeenCalled();
    expect(mockProjectApi.getDeliveryProjectById).not.toHaveBeenCalled();
    expect(mockProjectApi.getDeliveryProjects).not.toHaveBeenCalled();
    expect(mockProjectApi.updateDeliveryProject).not.toHaveBeenCalled();
  });
  it('Should call the api when submitting.', async () => {
    const { mockAlertApi, mockProjectApi, render } = setup();
    usePermission.mockReturnValue({ allowed: true, loading: false });
    DialogForm.mockReturnValue(<span>This is a dialog!</span>);

    const { result } = await render({ content: 'My button' });
    await userEvent.click(result.getByTestId('create-delivery-project-button'));

    expect(result.baseElement).toMatchSnapshot();
    expect(DialogForm.mock.calls).toHaveLength(1);
    const formProps = DialogForm.mock.calls[0][0];
    expect(mockProjectApi.createDeliveryProject).not.toHaveBeenCalled();
    expect(mockProjectApi.getDeliveryProjectById).not.toHaveBeenCalled();
    expect(mockProjectApi.getDeliveryProjects).not.toHaveBeenCalled();
    expect(mockProjectApi.updateDeliveryProject).not.toHaveBeenCalled();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();

    const submitResult = await formProps.submit(fields);
    expect(submitResult).toMatchObject({ type: 'success' });
    expect(mockProjectApi.createDeliveryProject.mock.calls).toMatchObject([
      [fields],
    ]);
    expect(mockProjectApi.getDeliveryProjectById).not.toHaveBeenCalled();
    expect(mockProjectApi.getDeliveryProjects).not.toHaveBeenCalled();
    expect(mockProjectApi.updateDeliveryProject).not.toHaveBeenCalled();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post.mock.calls).toMatchObject([
      [
        {
          message: 'Delivery Project created successfully.',
          severity: 'success',
          display: 'transient',
        },
      ],
    ]);
  });
  it('Should catch ValidationErrors when submitting.', async () => {
    const { mockAlertApi, mockProjectApi, render } = setup();
    usePermission.mockReturnValue({ allowed: true, loading: false });
    DialogForm.mockReturnValue(<span>This is a dialog!</span>);
    const validationErrors: IValidationError[] = [
      {
        path: 'abc',
        error: {
          message: '123',
        },
      },
    ];
    mockProjectApi.createDeliveryProject.mockRejectedValueOnce(
      new ValidationError(validationErrors),
    );

    const { result } = await render({ content: 'My button' });
    await userEvent.click(result.getByTestId('create-delivery-project-button'));

    expect(result.baseElement).toMatchSnapshot();
    expect(DialogForm.mock.calls).toHaveLength(1);
    const formProps = DialogForm.mock.calls[0][0];
    expect(mockProjectApi.createDeliveryProject).not.toHaveBeenCalled();
    expect(mockProjectApi.getDeliveryProjectById).not.toHaveBeenCalled();
    expect(mockProjectApi.getDeliveryProjects).not.toHaveBeenCalled();
    expect(mockProjectApi.updateDeliveryProject).not.toHaveBeenCalled();

    const submitResult = await formProps.submit(fields);
    expect(submitResult).toMatchObject({
      type: 'validationError',
      errors: validationErrors,
    });
    expect(mockProjectApi.createDeliveryProject.mock.calls).toMatchObject([
      [fields],
    ]);
    expect(mockProjectApi.getDeliveryProjectById).not.toHaveBeenCalled();
    expect(mockProjectApi.getDeliveryProjects).not.toHaveBeenCalled();
    expect(mockProjectApi.updateDeliveryProject).not.toHaveBeenCalled();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
  });
});

function setup() {
  const mockAlertApi: jest.Mocked<AlertApi> = {
    alert$: jest.fn(),
    post: jest.fn(),
  };
  const mockProjectApi: jest.Mocked<DeliveryProjectApi> = {
    createDeliveryProject: jest.fn(),
    getDeliveryProjectById: jest.fn(),
    updateDeliveryProject: jest.fn(),
    getDeliveryProjects: jest.fn(),
  };

  return {
    mockAlertApi,
    mockProjectApi,
    async render(props: CreateDeliveryProjectButtonProps) {
      const result = testRender(
        <TestApiProvider
          apis={[
            [alertApiRef, mockAlertApi],
            [deliveryProjectApiRef, mockProjectApi],
          ]}
        >
          <SnapshotFriendlyStylesProvider>
            <CreateDeliveryProjectButton {...props} />
          </SnapshotFriendlyStylesProvider>
        </TestApiProvider>,
      );
      await waitFor(() => expect(result.baseElement).not.toBeEmptyDOMElement());
      return { result };
    },
  };
}

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
    } satisfies typeof PluginPermissionReactModule),
);

jest.mock(
  '../../utils/DialogForm',
  () =>
    ({
      get DialogForm() {
        return DialogForm as typeof DialogFormModule.DialogForm;
      },
    } satisfies typeof DialogFormModule),
);
