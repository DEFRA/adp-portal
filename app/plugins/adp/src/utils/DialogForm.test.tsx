import type { AlertApi } from '@backstage/core-plugin-api';
import { alertApiRef } from '@backstage/core-plugin-api';
import { TestApiProvider } from '@backstage/test-utils';
import {
  prettyFormat,
  render as testRender,
  waitFor,
} from '@testing-library/react';
import React from 'react';
import type { DialogFormProps, SubmitResult } from './DialogForm';
import { DialogForm } from './DialogForm';
import type { FieldValues } from 'react-hook-form';
import userEvent from '@testing-library/user-event';
import { SnapshotFriendlyStylesProvider } from './SnapshotFriendlyStylesProvider';

describe('DialogForm', () => {
  it('Should not render when closed', async () => {
    // arrange
    const { render, alertApi } = setup();
    const props: jest.Mocked<DialogFormProps<{ foo: string }>> = {
      completed: jest.fn(),
      defaultValues: { foo: '' },
      renderFields: jest.fn(),
      submit: jest.fn(),
      title: 'My form',
      open: false,
    };

    // act
    const result = await render(props);

    // assert
    expect(result.baseElement).toMatchSnapshot();
    expect(props.completed.mock.calls).toMatchObject([]);
    expect(props.submit.mock.calls).toMatchObject([]);
    expect(props.renderFields).not.toHaveBeenCalled();
    expect(alertApi.alert$).not.toHaveBeenCalled();
    expect(alertApi.post).not.toHaveBeenCalled();
  });
  it('Should render when open', async () => {
    // arrange
    const { render, alertApi } = setup();
    const props: jest.Mocked<DialogFormProps<{ foo: string }>> = {
      completed: jest.fn(),
      defaultValues: { foo: '' },
      renderFields: jest.fn(),
      submit: jest.fn(),
      title: 'My form',
      open: true,
    };

    // act
    const result = await render(props);

    // assert
    expect(result.baseElement).toMatchSnapshot();
    expect(props.completed.mock.calls).toMatchObject([]);
    expect(props.submit.mock.calls).toMatchObject([]);
    expect(props.renderFields).toHaveBeenCalled();
    expect(alertApi.alert$).not.toHaveBeenCalled();
    expect(alertApi.post).not.toHaveBeenCalled();
  });
  it('Should call completed when cancel is clicked', async () => {
    // arrange
    const { render, alertApi } = setup();
    const props: jest.Mocked<DialogFormProps<{ foo: string }>> = {
      completed: jest.fn(),
      defaultValues: { foo: '' },
      renderFields: jest.fn(),
      submit: jest.fn(),
      title: 'My form',
      open: true,
    };

    // act
    const result = await render(props);
    await userEvent.click(result.getByTestId('actions-modal-cancel-button'));

    // assert
    expect(result.baseElement).toMatchSnapshot();
    expect(props.completed.mock.calls).toMatchObject([[undefined]]);
    expect(props.submit.mock.calls).toMatchObject([]);
    expect(props.renderFields).toHaveBeenCalled();
    expect(alertApi.alert$).not.toHaveBeenCalled();
    expect(alertApi.post).not.toHaveBeenCalled();
  });
  it('Should call submit when confirm is clicked', async () => {
    // arrange
    const { render, alertApi } = setup();
    const props: jest.Mocked<DialogFormProps<{ foo: string }>> = {
      completed: jest.fn(),
      defaultValues: { foo: '' },
      renderFields: jest.fn(),
      submit: jest.fn(),
      title: 'My form',
      open: true,
    };
    props.submit.mockReturnValueOnce(new Promise(() => {}));

    // act
    const result = await render(props);
    await userEvent.click(result.getByTestId('actions-modal-submit-button'));

    // assert
    expect(result.baseElement).toMatchSnapshot();
    expect(props.completed.mock.calls).toMatchObject([]);
    expect(props.submit.mock.calls).toMatchObject([[{ foo: '' }]]);
    expect(props.renderFields).toHaveBeenCalled();
    expect(alertApi.alert$).not.toHaveBeenCalled();
    expect(alertApi.post).not.toHaveBeenCalled();
  });
  it('Should block the form while submitting', async () => {
    // arrange
    const { render, alertApi } = setup();
    const props: jest.Mocked<DialogFormProps<{ foo: string }>> = {
      completed: jest.fn(),
      defaultValues: { foo: '' },
      renderFields: jest.fn(),
      submit: jest.fn(),
      title: 'My form',
      open: true,
    };
    let finishSubmit: (value: SubmitResult<{ foo: string }>) => void = null!;
    props.submit.mockReturnValueOnce(new Promise(res => (finishSubmit = res)));

    // act
    const result = await render(props);
    await userEvent.click(result.getByTestId('actions-modal-submit-button'));
    await waitFor(() =>
      expect(props.renderFields.mock.lastCall?.[0]?.disabled).toBe(true),
    );

    // assert
    expect(result.baseElement).toMatchSnapshot('Submitting');
    expect(props.completed.mock.calls).toMatchObject([]);
    expect(props.submit.mock.calls).toMatchObject([[{ foo: '' }]]);
    expect(props.renderFields).toHaveBeenCalled();
    expect(alertApi.alert$).not.toHaveBeenCalled();
    expect(alertApi.post).not.toHaveBeenCalled();

    finishSubmit({ type: 'success' });
    await waitFor(() =>
      expect(props.completed.mock.calls).toMatchObject([[{ foo: '' }]]),
    );
    expect(result.baseElement).toMatchSnapshot('Submitted');
    expect(props.submit.mock.calls).toMatchObject([[{ foo: '' }]]);
    expect(props.renderFields).toHaveBeenCalled();
    expect(alertApi.alert$).not.toHaveBeenCalled();
    expect(alertApi.post).not.toHaveBeenCalled();
  });
  it('Should raise an alert when submitting throws an error', async () => {
    // arrange
    const { render, alertApi } = setup();
    const props: jest.Mocked<DialogFormProps<{ foo: string }>> = {
      completed: jest.fn(),
      defaultValues: { foo: '' },
      renderFields: jest.fn(),
      submit: jest.fn(),
      title: 'My form',
      open: true,
    };
    const expectedError = new Error('Testing');
    let finishSubmit: (error: unknown) => void = null!;
    props.submit.mockReturnValueOnce(
      new Promise((_, rej) => (finishSubmit = rej)),
    );

    // act
    const result = await render(props);
    await userEvent.click(result.getByTestId('actions-modal-submit-button'));
    await waitFor(() =>
      expect(props.renderFields.mock.lastCall?.[0]?.disabled).toBe(true),
    );

    // assert
    expect(result.baseElement).toMatchSnapshot('Submitting');
    expect(props.completed.mock.calls).toMatchObject([]);
    expect(props.submit.mock.calls).toMatchObject([[{ foo: '' }]]);
    expect(props.renderFields).toHaveBeenCalled();
    expect(alertApi.alert$).not.toHaveBeenCalled();
    expect(alertApi.post).not.toHaveBeenCalled();

    finishSubmit(expectedError);
    await waitFor(() =>
      expect(alertApi.post.mock.calls).toMatchObject([
        [
          {
            message: 'Error: Testing',
            severity: 'error',
            display: 'transient',
          },
        ],
      ]),
    );
    expect(result.baseElement).toMatchSnapshot('Submitted');
    expect(props.submit.mock.calls).toMatchObject([[{ foo: '' }]]);
    expect(props.completed.mock.calls).toMatchObject([]);
    expect(props.renderFields).toHaveBeenCalled();
    expect(alertApi.alert$).not.toHaveBeenCalled();
  });
  it('Should not call completed when submit returns a validation error', async () => {
    // arrange
    const { render, alertApi } = setup();
    const props: jest.Mocked<DialogFormProps<{ foo: string }>> = {
      completed: jest.fn(),
      defaultValues: { foo: '' },
      renderFields: jest.fn(),
      submit: jest.fn(),
      title: 'My form',
      open: true,
    };
    let finishSubmit: (value: SubmitResult<{ foo: string }>) => void = null!;
    props.submit.mockReturnValueOnce(new Promise(res => (finishSubmit = res)));

    // act
    const result = await render(props);
    await userEvent.click(result.getByTestId('actions-modal-submit-button'));
    await waitFor(() =>
      expect(props.renderFields.mock.lastCall?.[0]?.disabled).toBe(true),
    );

    // assert
    expect(result.baseElement).toMatchSnapshot('Submitting');
    expect(props.completed.mock.calls).toMatchObject([]);
    expect(props.submit.mock.calls).toMatchObject([[{ foo: '' }]]);
    expect(props.renderFields).toHaveBeenCalled();
    expect(alertApi.alert$).not.toHaveBeenCalled();
    expect(alertApi.post).not.toHaveBeenCalled();

    await React.act(async () => {
      finishSubmit({ type: 'validationError', errors: [] });
      await new Promise(res => setTimeout(res, 1));
    });

    expect(result.baseElement).toMatchSnapshot('Submitted');
    expect(props.submit.mock.calls).toMatchObject([[{ foo: '' }]]);
    expect(props.completed.mock.calls).toMatchObject([]);
    expect(props.renderFields).toHaveBeenCalled();
    expect(alertApi.alert$).not.toHaveBeenCalled();
    expect(alertApi.post).not.toHaveBeenCalled();
  });
});

function setup() {
  const alertApi: jest.Mocked<AlertApi> = {
    alert$: jest.fn(),
    post: jest.fn(),
  };

  return {
    alertApi,
    async render<TForm extends FieldValues>(props: DialogFormProps<TForm>) {
      const result = testRender(
        <TestApiProvider apis={[[alertApiRef, alertApi]]}>
          <SnapshotFriendlyStylesProvider>
            <DialogForm
              {...props}
              renderFields={(...args) => {
                return (
                  props.renderFields(...args) ?? (
                    <div>{prettyFormat.format(args)}</div>
                  )
                );
              }}
            />
          </SnapshotFriendlyStylesProvider>
        </TestApiProvider>,
      );

      await waitFor(() => expect(result.baseElement).not.toBeEmptyDOMElement());

      return result;
    },
  };
}
