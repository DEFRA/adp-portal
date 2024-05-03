import { AlertApi, alertApiRef } from '@backstage/core-plugin-api';
import React from 'react';
import { ArmsLengthBodyApi, armsLengthBodyApiRef } from './api';
import { render, waitFor } from '@testing-library/react';
import { TestApiProvider } from '@backstage/test-utils';
import { EditAlbButton, EditAlbButtonProps } from './EditAlbButton';
import userEvent from '@testing-library/user-event';
import { AlbFields, AlbFormFields } from './AlbFormFields';
import { act } from 'react-dom/test-utils';
import {
  ArmsLengthBody,
  ValidationError as IValidationError,
} from '@internal/plugin-adp-common';
import { ValidationError } from '../../utils';

beforeEach(() => {
  jest.resetAllMocks();
});

describe('EditAlbButton', () => {
  it('Should not render when the user is not allowed to edit albs', async () => {
    const { mockAlertApi, mockArmsLengthBodyApi, render } = setup();
    usePermission.mockReturnValue({ allowed: false, loading: false });

    const { result } = await render({ content: 'My button', armsLengthBody });

    expect(result.baseElement).toMatchSnapshot();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
    expect(mockArmsLengthBodyApi.createArmsLengthBody).not.toHaveBeenCalled();
    expect(mockArmsLengthBodyApi.getArmsLengthBodies).not.toHaveBeenCalled();
    expect(mockArmsLengthBodyApi.getArmsLengthBodyNames).not.toHaveBeenCalled();
    expect(mockArmsLengthBodyApi.updateArmsLengthBody).not.toHaveBeenCalled();
  });
  it('Should only render a button initially', async () => {
    const { mockAlertApi, mockArmsLengthBodyApi, render } = setup();
    usePermission.mockReturnValue({ allowed: true, loading: false });

    const { result } = await render({ content: 'My button', armsLengthBody });

    expect(result.baseElement).toMatchSnapshot();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
    expect(mockArmsLengthBodyApi.createArmsLengthBody).not.toHaveBeenCalled();
    expect(mockArmsLengthBodyApi.getArmsLengthBodies).not.toHaveBeenCalled();
    expect(mockArmsLengthBodyApi.getArmsLengthBodyNames).not.toHaveBeenCalled();
    expect(mockArmsLengthBodyApi.updateArmsLengthBody).not.toHaveBeenCalled();
  });
  it('Should render the dialog when the button is clicked', async () => {
    const { mockAlertApi, mockArmsLengthBodyApi, render } = setup();
    usePermission.mockReturnValue({ allowed: true, loading: false });
    DialogForm.mockReturnValue(<span>This is a dialog!</span>);

    const { result } = await render({ content: 'My button', armsLengthBody });
    await userEvent.click(result.getByTestId('alb-edit-button'));

    expect(result.baseElement).toMatchSnapshot();
    expect(DialogForm.mock.calls).toHaveLength(1);
    const formProps = DialogForm.mock.calls[0][0];
    expect({
      title: formProps.title,
      open: formProps.open,
      renderFields: formProps.renderFields,
      confirm: formProps.confirm,
      cancel: formProps.cancel,
      defaultValues: formProps.defaultValues,
      disabled: formProps.disabled,
      validate: formProps.validate,
    }).toMatchObject({
      title: 'Update ALB My cool ALB',
      open: undefined,
      renderFields: AlbFormFields,
      confirm: 'Update',
      cancel: undefined,
      defaultValues: {
        description: armsLengthBody.description,
        title: armsLengthBody.title,
        url: armsLengthBody.url,
        alias: armsLengthBody.alias,
      },
      disabled: undefined,
      validate: undefined,
    });
    expect(formProps.submit).toBeDefined();
    expect(formProps.completed).toBeDefined();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
    expect(mockArmsLengthBodyApi.createArmsLengthBody).not.toHaveBeenCalled();
    expect(mockArmsLengthBodyApi.getArmsLengthBodies).not.toHaveBeenCalled();
    expect(mockArmsLengthBodyApi.getArmsLengthBodyNames).not.toHaveBeenCalled();
    expect(mockArmsLengthBodyApi.updateArmsLengthBody).not.toHaveBeenCalled();
  });
  it('Should close the form when the form is cancelled.', async () => {
    const { mockAlertApi, mockArmsLengthBodyApi, render } = setup();
    usePermission.mockReturnValue({ allowed: true, loading: false });
    DialogForm.mockReturnValue(<span>This is a dialog!</span>);

    const { result } = await render({ content: 'My button', armsLengthBody });
    await userEvent.click(result.getByTestId('alb-edit-button'));

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
    expect(mockArmsLengthBodyApi.createArmsLengthBody).not.toHaveBeenCalled();
    expect(mockArmsLengthBodyApi.getArmsLengthBodies).not.toHaveBeenCalled();
    expect(mockArmsLengthBodyApi.getArmsLengthBodyNames).not.toHaveBeenCalled();
    expect(mockArmsLengthBodyApi.updateArmsLengthBody).not.toHaveBeenCalled();
  });
  it('Should call onEditd when the form closes with a value.', async () => {
    const { mockAlertApi, mockArmsLengthBodyApi, render } = setup();
    usePermission.mockReturnValue({ allowed: true, loading: false });
    DialogForm.mockReturnValue(<span>This is a dialog!</span>);
    const onEdited: jest.MockedFn<
      Exclude<EditAlbButtonProps['onEdited'], undefined>
    > = jest.fn();

    const { result } = await render({
      content: 'My button',
      armsLengthBody,
      onEdited,
    });
    await userEvent.click(result.getByTestId('alb-edit-button'));

    expect(result.baseElement).toMatchSnapshot('Before complete');
    expect(DialogForm.mock.calls).toHaveLength(1);
    expect(onEdited).not.toHaveBeenCalled();
    const formProps = DialogForm.mock.calls[0][0];
    act(() => formProps.completed(fields));
    await waitFor(() =>
      expect(result.queryByText('This is a dialog!')).toBeNull(),
    );
    expect(result.baseElement).toMatchSnapshot('After complete');
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
    expect(onEdited).toHaveBeenCalledTimes(1);
    expect(mockArmsLengthBodyApi.createArmsLengthBody).not.toHaveBeenCalled();
    expect(mockArmsLengthBodyApi.getArmsLengthBodies).not.toHaveBeenCalled();
    expect(mockArmsLengthBodyApi.getArmsLengthBodyNames).not.toHaveBeenCalled();
    expect(mockArmsLengthBodyApi.updateArmsLengthBody).not.toHaveBeenCalled();
  });
  it('Should call the api when submitting.', async () => {
    const { mockAlertApi, mockArmsLengthBodyApi, render } = setup();
    usePermission.mockReturnValue({ allowed: true, loading: false });
    DialogForm.mockReturnValue(<span>This is a dialog!</span>);

    const { result } = await render({ content: 'My button', armsLengthBody });
    await userEvent.click(result.getByTestId('alb-edit-button'));

    expect(result.baseElement).toMatchSnapshot();
    expect(DialogForm.mock.calls).toHaveLength(1);
    const formProps = DialogForm.mock.calls[0][0];
    expect(mockArmsLengthBodyApi.createArmsLengthBody).not.toHaveBeenCalled();
    expect(mockArmsLengthBodyApi.getArmsLengthBodies).not.toHaveBeenCalled();
    expect(mockArmsLengthBodyApi.getArmsLengthBodyNames).not.toHaveBeenCalled();
    expect(mockArmsLengthBodyApi.updateArmsLengthBody).not.toHaveBeenCalled();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();

    const submitResult = await formProps.submit(fields);
    expect(submitResult).toMatchObject({ type: 'success' });
    expect(mockArmsLengthBodyApi.updateArmsLengthBody.mock.calls).toMatchObject(
      [[fields]],
    );
    expect(mockArmsLengthBodyApi.getArmsLengthBodies).not.toHaveBeenCalled();
    expect(mockArmsLengthBodyApi.getArmsLengthBodyNames).not.toHaveBeenCalled();
    expect(mockArmsLengthBodyApi.createArmsLengthBody).not.toHaveBeenCalled();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post.mock.calls).toMatchObject([
      [
        {
          message: 'ALB edited successfully.',
          severity: 'success',
          display: 'transient',
        },
      ],
    ]);
  });
  it('Should catch ValidationErrors when submitting.', async () => {
    const { mockAlertApi, mockArmsLengthBodyApi, render } = setup();
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
    mockArmsLengthBodyApi.updateArmsLengthBody.mockRejectedValueOnce(
      new ValidationError(validationErrors),
    );

    const { result } = await render({ content: 'My button', armsLengthBody });
    await userEvent.click(result.getByTestId('alb-edit-button'));

    expect(result.baseElement).toMatchSnapshot();
    expect(DialogForm.mock.calls).toHaveLength(1);
    const formProps = DialogForm.mock.calls[0][0];
    expect(mockArmsLengthBodyApi.createArmsLengthBody).not.toHaveBeenCalled();
    expect(mockArmsLengthBodyApi.getArmsLengthBodies).not.toHaveBeenCalled();
    expect(mockArmsLengthBodyApi.getArmsLengthBodyNames).not.toHaveBeenCalled();
    expect(mockArmsLengthBodyApi.updateArmsLengthBody).not.toHaveBeenCalled();

    const submitResult = await formProps.submit(fields);
    expect(submitResult).toMatchObject({
      type: 'validationError',
      errors: validationErrors,
    });
    expect(mockArmsLengthBodyApi.updateArmsLengthBody.mock.calls).toMatchObject(
      [[fields]],
    );
    expect(mockArmsLengthBodyApi.getArmsLengthBodies).not.toHaveBeenCalled();
    expect(mockArmsLengthBodyApi.getArmsLengthBodyNames).not.toHaveBeenCalled();
    expect(mockArmsLengthBodyApi.createArmsLengthBody).not.toHaveBeenCalled();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
  });
});

const armsLengthBody: ArmsLengthBody = {
  created_at: new Date(0),
  creator: 'Me',
  description: 'My ALB',
  id: '00000000-0000-0000-0000-000000000001',
  name: 'my-cool-alb',
  owner: 'Someone',
  title: 'My cool ALB',
  updated_at: new Date(0),
  alias: 'CAB',
  url: 'https://test.com',
};
const fields: AlbFields = {
  alias: 'abc',
  description: 'def',
  title: 'ghi',
  url: 'jkl',
};

function setup() {
  const mockAlertApi: jest.Mocked<AlertApi> = {
    alert$: jest.fn(),
    post: jest.fn(),
  };
  const mockArmsLengthBodyApi: jest.Mocked<ArmsLengthBodyApi> = {
    createArmsLengthBody: jest.fn(),
    getArmsLengthBodies: jest.fn(),
    getArmsLengthBodyNames: jest.fn(),
    updateArmsLengthBody: jest.fn(),
  };

  return {
    mockAlertApi,
    mockArmsLengthBodyApi,
    async render(props: EditAlbButtonProps) {
      const result = render(
        <TestApiProvider
          apis={[
            [alertApiRef, mockAlertApi],
            [armsLengthBodyApiRef, mockArmsLengthBodyApi],
          ]}
        >
          <EditAlbButton {...props} />
        </TestApiProvider>,
      );
      await waitFor(() => expect(result.baseElement).not.toBeEmptyDOMElement());
      return { result };
    },
  };
}

const usePermission: jest.MockedFn<
  typeof import('@backstage/plugin-permission-react').usePermission
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
    } satisfies typeof import('@backstage/plugin-permission-react')),
);

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
