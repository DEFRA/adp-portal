import type { AlertApi } from '@backstage/core-plugin-api';
import { alertApiRef } from '@backstage/core-plugin-api';
import React from 'react';
import type { DeliveryProgrammeApi } from './api';
import { deliveryProgrammeApiRef } from './api';
import { render as testRender, waitFor } from '@testing-library/react';
import { TestApiProvider } from '@backstage/test-utils';
import type { EditDeliveryProgrammeButtonProps } from './EditDeliveryProgrammeButton';
import { EditDeliveryProgrammeButton } from './EditDeliveryProgrammeButton';
import userEvent from '@testing-library/user-event';
import type { DeliveryProgrammeFields } from './DeliveryProgrammeFormFields';
import { DeliveryProgrammeFormFields } from './DeliveryProgrammeFormFields';
import type {
  DeliveryProgramme,
  ValidationError as IValidationError,
} from '@internal/plugin-adp-common';
import { SnapshotFriendlyStylesProvider, ValidationError } from '../../utils';
import type * as PluginPermissionReactModule from '@backstage/plugin-permission-react';
import type * as DialogFormModule from '../../utils/DialogForm';

const usePermission: jest.MockedFn<
  typeof PluginPermissionReactModule.usePermission
> = jest.fn();
const DialogForm: jest.MockedFn<typeof DialogFormModule.DialogForm> = jest.fn();

const deliveryProgramme: DeliveryProgramme = {
  arms_length_body_id: '00000000-0000-0000-0000-000000000001',
  created_at: new Date(0),
  delivery_programme_code: 'ADP',
  description: 'My programme',
  id: '00000000-0000-0000-0000-000000000002',
  name: 'my-cool-programme',
  delivery_programme_admins: [],
  title: 'My cool Programme',
  updated_at: new Date(0),
  alias: 'best programme',
  children: [],
  updated_by: 'Someone',
  url: 'https://test.com',
};

const fields: DeliveryProgrammeFields = {
  alias: 'abc',
  arms_length_body_id: 'def',
  delivery_programme_code: 'ghi',
  description: 'jkl',
  title: 'mno',
  url: 'pqr',
};

beforeEach(() => {
  jest.resetAllMocks();
});

describe('EditDeliveryProgrammeButton', () => {
  it('Should not render when the user is not allowed to edit delivery programmes', async () => {
    const { mockAlertApi, mockProgrammeApi, render } = setup();
    usePermission.mockReturnValue({ allowed: false, loading: false });

    const { result } = await render({
      content: 'My button',
      deliveryProgramme,
    });

    expect(result.baseElement).toMatchSnapshot();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
    expect(mockProgrammeApi.createDeliveryProgramme).not.toHaveBeenCalled();
    expect(mockProgrammeApi.getDeliveryProgrammeAdmins).not.toHaveBeenCalled();
    expect(mockProgrammeApi.getDeliveryProgrammeById).not.toHaveBeenCalled();
    expect(mockProgrammeApi.getDeliveryProgrammes).not.toHaveBeenCalled();
    expect(mockProgrammeApi.updateDeliveryProgramme).not.toHaveBeenCalled();
  });
  it('Should only render a button initially', async () => {
    const { mockAlertApi, mockProgrammeApi, render } = setup();
    usePermission.mockReturnValue({ allowed: true, loading: false });

    const { result } = await render({
      content: 'My button',
      deliveryProgramme,
    });

    expect(result.baseElement).toMatchSnapshot();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
    expect(mockProgrammeApi.createDeliveryProgramme).not.toHaveBeenCalled();
    expect(mockProgrammeApi.getDeliveryProgrammeAdmins).not.toHaveBeenCalled();
    expect(mockProgrammeApi.getDeliveryProgrammeById).not.toHaveBeenCalled();
    expect(mockProgrammeApi.getDeliveryProgrammes).not.toHaveBeenCalled();
    expect(mockProgrammeApi.updateDeliveryProgramme).not.toHaveBeenCalled();
  });
  it('Should render the dialog when the button is clicked', async () => {
    const { mockAlertApi, mockProgrammeApi, render } = setup();
    usePermission.mockReturnValue({ allowed: true, loading: false });
    DialogForm.mockReturnValue(<span>This is a dialog!</span>);

    const { result } = await render({
      content: 'My button',
      deliveryProgramme,
    });
    await userEvent.click(result.getByTestId('edit-delivery-programme-button'));

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
      renderFields: DeliveryProgrammeFormFields,
      confirm: 'Update',
      cancel: undefined,
      defaultValues: {
        description: deliveryProgramme.description,
        title: deliveryProgramme.title,
        url: deliveryProgramme.url,
        alias: deliveryProgramme.alias,
      },
      disabled: undefined,
      validate: undefined,
    });
    expect(formProps.submit).toBeDefined();
    expect(formProps.completed).toBeDefined();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
    expect(mockProgrammeApi.createDeliveryProgramme).not.toHaveBeenCalled();
    expect(mockProgrammeApi.getDeliveryProgrammeAdmins).not.toHaveBeenCalled();
    expect(mockProgrammeApi.getDeliveryProgrammeById).not.toHaveBeenCalled();
    expect(mockProgrammeApi.getDeliveryProgrammes).not.toHaveBeenCalled();
    expect(mockProgrammeApi.updateDeliveryProgramme).not.toHaveBeenCalled();
  });
  it('Should close the form when the form is cancelled.', async () => {
    const { mockAlertApi, mockProgrammeApi, render } = setup();
    usePermission.mockReturnValue({ allowed: true, loading: false });
    DialogForm.mockReturnValue(<span>This is a dialog!</span>);

    const { result } = await render({
      content: 'My button',
      deliveryProgramme,
    });
    await userEvent.click(result.getByTestId('edit-delivery-programme-button'));

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
    expect(mockProgrammeApi.createDeliveryProgramme).not.toHaveBeenCalled();
    expect(mockProgrammeApi.getDeliveryProgrammeAdmins).not.toHaveBeenCalled();
    expect(mockProgrammeApi.getDeliveryProgrammeById).not.toHaveBeenCalled();
    expect(mockProgrammeApi.getDeliveryProgrammes).not.toHaveBeenCalled();
    expect(mockProgrammeApi.updateDeliveryProgramme).not.toHaveBeenCalled();
  });
  it('Should call onEditd when the form closes with a value.', async () => {
    const { mockAlertApi, mockProgrammeApi, render } = setup();
    usePermission.mockReturnValue({ allowed: true, loading: false });
    DialogForm.mockReturnValue(<span>This is a dialog!</span>);
    const onEdited: jest.MockedFn<
      Exclude<EditDeliveryProgrammeButtonProps['onEdited'], undefined>
    > = jest.fn();

    const { result } = await render({
      content: 'My button',
      deliveryProgramme,
      onEdited,
    });
    await userEvent.click(result.getByTestId('edit-delivery-programme-button'));

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
    expect(mockProgrammeApi.createDeliveryProgramme).not.toHaveBeenCalled();
    expect(mockProgrammeApi.getDeliveryProgrammeAdmins).not.toHaveBeenCalled();
    expect(mockProgrammeApi.getDeliveryProgrammeById).not.toHaveBeenCalled();
    expect(mockProgrammeApi.getDeliveryProgrammes).not.toHaveBeenCalled();
    expect(mockProgrammeApi.updateDeliveryProgramme).not.toHaveBeenCalled();
  });
  it('Should call the api when submitting.', async () => {
    const { mockAlertApi, mockProgrammeApi, render } = setup();
    usePermission.mockReturnValue({ allowed: true, loading: false });
    DialogForm.mockReturnValue(<span>This is a dialog!</span>);

    const { result } = await render({
      content: 'My button',
      deliveryProgramme,
    });
    await userEvent.click(result.getByTestId('edit-delivery-programme-button'));

    expect(result.baseElement).toMatchSnapshot();
    expect(DialogForm.mock.calls).toHaveLength(1);
    const formProps = DialogForm.mock.calls[0][0];
    expect(mockProgrammeApi.createDeliveryProgramme).not.toHaveBeenCalled();
    expect(mockProgrammeApi.getDeliveryProgrammeAdmins).not.toHaveBeenCalled();
    expect(mockProgrammeApi.getDeliveryProgrammeById).not.toHaveBeenCalled();
    expect(mockProgrammeApi.getDeliveryProgrammes).not.toHaveBeenCalled();
    expect(mockProgrammeApi.updateDeliveryProgramme).not.toHaveBeenCalled();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();

    const submitResult = await formProps.submit(fields);
    expect(submitResult).toMatchObject({ type: 'success' });
    expect(mockProgrammeApi.updateDeliveryProgramme.mock.calls).toMatchObject([
      [fields],
    ]);
    expect(mockProgrammeApi.createDeliveryProgramme).not.toHaveBeenCalled();
    expect(mockProgrammeApi.getDeliveryProgrammeAdmins).not.toHaveBeenCalled();
    expect(mockProgrammeApi.getDeliveryProgrammeById).not.toHaveBeenCalled();
    expect(mockProgrammeApi.getDeliveryProgrammes).not.toHaveBeenCalled();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post.mock.calls).toMatchObject([
      [
        {
          message: 'Delivery Programme updated successfully.',
          severity: 'success',
          display: 'transient',
        },
      ],
    ]);
  });
  it('Should catch ValidationErrors when submitting.', async () => {
    const { mockAlertApi, mockProgrammeApi, render } = setup();
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
    mockProgrammeApi.updateDeliveryProgramme.mockRejectedValueOnce(
      new ValidationError(validationErrors),
    );

    const { result } = await render({
      content: 'My button',
      deliveryProgramme,
    });
    await userEvent.click(result.getByTestId('edit-delivery-programme-button'));

    expect(result.baseElement).toMatchSnapshot();
    expect(DialogForm.mock.calls).toHaveLength(1);
    const formProps = DialogForm.mock.calls[0][0];
    expect(mockProgrammeApi.createDeliveryProgramme).not.toHaveBeenCalled();
    expect(mockProgrammeApi.getDeliveryProgrammeAdmins).not.toHaveBeenCalled();
    expect(mockProgrammeApi.getDeliveryProgrammeById).not.toHaveBeenCalled();
    expect(mockProgrammeApi.getDeliveryProgrammes).not.toHaveBeenCalled();
    expect(mockProgrammeApi.updateDeliveryProgramme).not.toHaveBeenCalled();

    const submitResult = await formProps.submit(fields);
    expect(submitResult).toMatchObject({
      type: 'validationError',
      errors: validationErrors,
    });
    expect(mockProgrammeApi.updateDeliveryProgramme.mock.calls).toMatchObject([
      [fields],
    ]);
    expect(mockProgrammeApi.createDeliveryProgramme).not.toHaveBeenCalled();
    expect(mockProgrammeApi.getDeliveryProgrammeAdmins).not.toHaveBeenCalled();
    expect(mockProgrammeApi.getDeliveryProgrammeById).not.toHaveBeenCalled();
    expect(mockProgrammeApi.getDeliveryProgrammes).not.toHaveBeenCalled();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
  });
});

function setup() {
  const mockAlertApi: jest.Mocked<AlertApi> = {
    alert$: jest.fn(),
    post: jest.fn(),
  };
  const mockProgrammeApi: jest.Mocked<DeliveryProgrammeApi> = {
    createDeliveryProgramme: jest.fn(),
    getDeliveryProgrammeAdmins: jest.fn(),
    getDeliveryProgrammeById: jest.fn(),
    updateDeliveryProgramme: jest.fn(),
    getDeliveryProgrammes: jest.fn(),
  };

  return {
    mockAlertApi,
    mockProgrammeApi,
    async render(props: EditDeliveryProgrammeButtonProps) {
      const result = testRender(
        <TestApiProvider
          apis={[
            [alertApiRef, mockAlertApi],
            [deliveryProgrammeApiRef, mockProgrammeApi],
          ]}
        >
          <SnapshotFriendlyStylesProvider>
            <EditDeliveryProgrammeButton {...props} />
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
