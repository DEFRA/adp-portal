import type { AlertApi} from '@backstage/core-plugin-api';
import { alertApiRef } from '@backstage/core-plugin-api';
import React from 'react';
import type { ArmsLengthBodyApi} from './api';
import { armsLengthBodyApiRef } from './api';
import { render as testRender, waitFor } from '@testing-library/react';
import { TestApiProvider } from '@backstage/test-utils';
import type { CreateAlbButtonProps } from './CreateAlbButton';
import { CreateAlbButton } from './CreateAlbButton';
import userEvent from '@testing-library/user-event';
import type { AlbFields} from './AlbFormFields';
import { AlbFormFields, emptyForm } from './AlbFormFields';
import { act } from 'react-dom/test-utils';
import type { ValidationError as IValidationError } from '@internal/plugin-adp-common';
import { ValidationError } from '../../utils';
import type * as PluginPermissionReactModule from '@backstage/plugin-permission-react';
import type * as DialogFormModule from '../../utils/DialogForm';

const usePermission: jest.MockedFn<
  typeof PluginPermissionReactModule.usePermission
> = jest.fn();
const DialogForm: jest.MockedFn<
  typeof DialogFormModule.DialogForm
> = jest.fn();

const fields: AlbFields = {
  alias: 'abc',
  description: 'def',
  title: 'ghi',
  url: 'jkl',
};

beforeEach(() => {
  jest.resetAllMocks();
});

describe('CreateAlbButton', () => {
  it('Should not render when the user is not allowed to create albs', async () => {
    const { mockAlertApi, mockArmsLengthBodyApi, render } = setup();
    usePermission.mockReturnValue({ allowed: false, loading: false });

    const { result } = await render({ content: 'My button' });

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

    const { result } = await render({ content: 'My button' });

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

    const { result } = await render({ content: 'My button' });
    await userEvent.click(result.getByTestId('create-alb-button'));

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
      title: 'Create a new Arms Length Body',
      open: undefined,
      renderFields: AlbFormFields,
      confirm: 'Create',
      cancel: undefined,
      defaultValues: emptyForm,
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

    const { result } = await render({ content: 'My button' });
    await userEvent.click(result.getByTestId('create-alb-button'));

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
  it('Should call onCreated when the form closes with a value.', async () => {
    const { mockAlertApi, mockArmsLengthBodyApi, render } = setup();
    usePermission.mockReturnValue({ allowed: true, loading: false });
    DialogForm.mockReturnValue(<span>This is a dialog!</span>);
    const onCreated: jest.MockedFn<
      Exclude<CreateAlbButtonProps['onCreated'], undefined>
    > = jest.fn();

    const { result } = await render({ content: 'My button', onCreated });
    await userEvent.click(result.getByTestId('create-alb-button'));

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
    expect(mockArmsLengthBodyApi.createArmsLengthBody).not.toHaveBeenCalled();
    expect(mockArmsLengthBodyApi.getArmsLengthBodies).not.toHaveBeenCalled();
    expect(mockArmsLengthBodyApi.getArmsLengthBodyNames).not.toHaveBeenCalled();
    expect(mockArmsLengthBodyApi.updateArmsLengthBody).not.toHaveBeenCalled();
  });
  it('Should call the api when submitting.', async () => {
    const { mockAlertApi, mockArmsLengthBodyApi, render } = setup();
    usePermission.mockReturnValue({ allowed: true, loading: false });
    DialogForm.mockReturnValue(<span>This is a dialog!</span>);

    const { result } = await render({ content: 'My button' });
    await userEvent.click(result.getByTestId('create-alb-button'));

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
    expect(mockArmsLengthBodyApi.createArmsLengthBody.mock.calls).toMatchObject(
      [[fields]],
    );
    expect(mockArmsLengthBodyApi.getArmsLengthBodies).not.toHaveBeenCalled();
    expect(mockArmsLengthBodyApi.getArmsLengthBodyNames).not.toHaveBeenCalled();
    expect(mockArmsLengthBodyApi.updateArmsLengthBody).not.toHaveBeenCalled();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post.mock.calls).toMatchObject([
      [
        {
          message: 'ALB created successfully.',
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
    mockArmsLengthBodyApi.createArmsLengthBody.mockRejectedValueOnce(
      new ValidationError(validationErrors),
    );

    const { result } = await render({ content: 'My button' });
    await userEvent.click(result.getByTestId('create-alb-button'));

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
    expect(mockArmsLengthBodyApi.createArmsLengthBody.mock.calls).toMatchObject(
      [[fields]],
    );
    expect(mockArmsLengthBodyApi.getArmsLengthBodies).not.toHaveBeenCalled();
    expect(mockArmsLengthBodyApi.getArmsLengthBodyNames).not.toHaveBeenCalled();
    expect(mockArmsLengthBodyApi.updateArmsLengthBody).not.toHaveBeenCalled();
    expect(mockAlertApi.alert$).not.toHaveBeenCalled();
    expect(mockAlertApi.post).not.toHaveBeenCalled();
  });
});

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
    async render(props: CreateAlbButtonProps) {
      const result = testRender(
        <TestApiProvider
          apis={[
            [alertApiRef, mockAlertApi],
            [armsLengthBodyApiRef, mockArmsLengthBodyApi],
          ]}
        >
          <CreateAlbButton {...props} />
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
