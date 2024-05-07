import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import {
  AddProgrammeAdminButton,
  AddProgrammeAdminButtonProps,
} from './AddProgrammeAdminButton';
import userEvent from '@testing-library/user-event';
import { DeliveryProgrammeAdminApi, deliveryProgrammeAdminApiRef } from './api';
import { AlertApi, alertApiRef } from '@backstage/core-plugin-api';
import { ValidationError as IValidationError } from '@internal/plugin-adp-common';
import { ValidationError } from '../../utils';
import { TestApiProvider } from '@backstage/test-utils';
import {
  DeliveryProgrammeAdminFields,
  DeliveryProgrammeAdminFormFields,
  emptyForm,
} from './DeliveryProgrammeAdminFormFields';

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
    async renderComponent(props: AddProgrammeAdminButtonProps) {
      const result = render(
        <TestApiProvider
          apis={[
            [alertApiRef, mockAlertApi],
            [deliveryProgrammeAdminApiRef, mockProgrammeAdminApi],
          ]}
        >
          <AddProgrammeAdminButton {...props} />
        </TestApiProvider>,
      );
      await waitFor(() => expect(result.baseElement).not.toBeEmptyDOMElement());
      return { result };
    },
  };
}

const fields: DeliveryProgrammeAdminFields = {
  aadEntityRefId: 'user-1234',
};

const DialogForm: jest.MockedFn<
  typeof import('../../utils/DialogForm').DialogForm
> = jest.fn();
jest.mock(
  '../../utils/DialogForm',
  () =>
    ({
      get DialogForm() {
        return DialogForm as typeof import('../../utils/DialogForm').DialogForm;
      },
    } satisfies typeof import('../../utils/DialogForm')),
);

describe('AddProgrammeAdminButton', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should only render a button initially', async () => {
    const { renderComponent, mockAlertApi, mockProgrammeAdminApi } = setup();

    const { result } = await renderComponent({
      content: 'Test button',
      deliveryProgrammeId: '123',
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
    DialogForm.mockReturnValue(<span>Test dialog</span>);

    const { result } = await renderComponent({
      content: 'Test button',
      deliveryProgrammeId: '123',
    });
    await userEvent.click(result.getByTestId('add-programme-admin-button'));

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
      renderFields: DeliveryProgrammeAdminFormFields,
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
    expect(mockProgrammeAdminApi.create).not.toHaveBeenCalled();
    expect(mockProgrammeAdminApi.delete).not.toHaveBeenCalled();
    expect(mockProgrammeAdminApi.getAll).not.toHaveBeenCalled();
    expect(
      mockProgrammeAdminApi.getByDeliveryProgrammeId,
    ).not.toHaveBeenCalled();
  });

  it('should close the dialog when the form is cancelled', async () => {
    const { renderComponent, mockAlertApi, mockProgrammeAdminApi } = setup();
    DialogForm.mockReturnValue(<span>Test dialog</span>);

    const { result } = await renderComponent({
      content: 'Test button',
      deliveryProgrammeId: '123',
    });
    await userEvent.click(result.getByTestId('add-programme-admin-button'));

    expect(result.baseElement).toMatchSnapshot('Before cancel');
    expect(DialogForm.mock.calls).toHaveLength(1);
    const formProps = DialogForm.mock.calls[0][0];
    act(() => formProps.completed(undefined));
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

  it('should call onCreated when the form closes with a value', async () => {
    const { renderComponent, mockAlertApi, mockProgrammeAdminApi } = setup();
    DialogForm.mockReturnValue(<span>Test dialog</span>);
    const onCreated: jest.MockedFn<
      Exclude<AddProgrammeAdminButtonProps['onCreated'], undefined>
    > = jest.fn();

    const { result } = await renderComponent({
      content: 'Test button',
      deliveryProgrammeId: '123',
      onCreated,
    });
    await userEvent.click(result.getByTestId('add-programme-admin-button'));

    expect(result.baseElement).toMatchSnapshot('Before complete');
    expect(DialogForm.mock.calls).toHaveLength(1);
    expect(onCreated).not.toHaveBeenCalled();
    const formProps = DialogForm.mock.calls[0][0];
    act(() => formProps.completed(fields));
    await waitFor(() => expect(result.queryByText('Test dialog')).toBeNull());
    expect(result.baseElement).toMatchSnapshot('After complete');
    expect(onCreated).toHaveBeenCalledTimes(1);
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
    DialogForm.mockReturnValue(<span>Test dialog</span>);

    const { result } = await renderComponent({
      content: 'Test button',
      deliveryProgrammeId: 'programme-1',
    });
    await userEvent.click(result.getByTestId('add-programme-admin-button'));

    expect(result.baseElement).toMatchSnapshot();
    expect(DialogForm.mock.calls).toHaveLength(1);
    const formProps = DialogForm.mock.calls[0][0];
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
    expect(mockProgrammeAdminApi.create).not.toHaveBeenCalled();
    expect(mockProgrammeAdminApi.delete).not.toHaveBeenCalled();
    expect(mockProgrammeAdminApi.getAll).not.toHaveBeenCalled();
    expect(
      mockProgrammeAdminApi.getByDeliveryProgrammeId,
    ).not.toHaveBeenCalled();

    const submitResult = await formProps.submit(fields);
    expect(submitResult).toMatchObject({ type: 'success' });
    expect(mockProgrammeAdminApi.create.mock.calls).toMatchObject([
      ['programme-1', ['user-1234']],
    ]);
    expect(mockProgrammeAdminApi.delete).not.toHaveBeenCalled();
    expect(mockProgrammeAdminApi.getAll).not.toHaveBeenCalled();
    expect(
      mockProgrammeAdminApi.getByDeliveryProgrammeId,
    ).not.toHaveBeenCalled();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post.mock.calls).toMatchObject([
      [
        {
          message: 'Delivery Programme Admin added successfully',
          severity: 'success',
          display: 'transient',
        },
      ],
    ]);
  });

  it('should catch validation errors when submitting', async () => {
    const { renderComponent, mockAlertApi, mockProgrammeAdminApi } = setup();
    DialogForm.mockReturnValue(<span>Test dialog</span>);
    const validationErrors: IValidationError[] = [
      {
        path: 'abc',
        error: {
          message: 'Something broke',
        },
      },
    ];
    mockProgrammeAdminApi.create.mockRejectedValueOnce(
      new ValidationError(validationErrors),
    );

    const { result } = await renderComponent({
      content: 'Test button',
      deliveryProgrammeId: 'programme-2',
    });
    await userEvent.click(result.getByTestId('add-programme-admin-button'));

    expect(result.baseElement).toMatchSnapshot();
    expect(DialogForm.mock.calls).toHaveLength(1);
    const formProps = DialogForm.mock.calls[0][0];
    expect(mockProgrammeAdminApi.create).not.toHaveBeenCalled();
    expect(mockProgrammeAdminApi.delete).not.toHaveBeenCalled();
    expect(mockProgrammeAdminApi.getAll).not.toHaveBeenCalled();
    expect(
      mockProgrammeAdminApi.getByDeliveryProgrammeId,
    ).not.toHaveBeenCalled();

    const submitResult = await formProps.submit(fields);
    expect(submitResult).toMatchObject({
      type: 'validationError',
      errors: validationErrors,
    });
    expect(mockProgrammeAdminApi.create.mock.calls).toMatchObject([
      ['programme-2', ['user-1234']],
    ]);
    expect(mockProgrammeAdminApi.delete).not.toHaveBeenCalled();
    expect(mockProgrammeAdminApi.getAll).not.toHaveBeenCalled();
    expect(
      mockProgrammeAdminApi.getByDeliveryProgrammeId,
    ).not.toHaveBeenCalled();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
  });
});
