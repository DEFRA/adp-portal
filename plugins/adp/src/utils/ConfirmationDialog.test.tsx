import type { AlertApi } from '@backstage/core-plugin-api';
import { alertApiRef } from '@backstage/core-plugin-api';
import React from 'react';
import type { ConfirmationDialogProps } from './ConfirmationDialog';
import { ConfirmationDialog } from './ConfirmationDialog';
import { TestApiProvider } from '@backstage/test-utils';
import { SnapshotFriendlyStylesProvider } from './SnapshotFriendlyStylesProvider';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

function setup() {
  const alertApi: jest.Mocked<AlertApi> = {
    alert$: jest.fn(),
    post: jest.fn(),
  };

  return {
    alertApi,
    async renderComponent(props: ConfirmationDialogProps) {
      const result = render(
        <TestApiProvider apis={[[alertApiRef, alertApi]]}>
          <SnapshotFriendlyStylesProvider>
            <ConfirmationDialog {...props} />
          </SnapshotFriendlyStylesProvider>
        </TestApiProvider>,
      );

      await waitFor(() => expect(result.baseElement).not.toBeEmptyDOMElement());
      return result;
    },
  };
}

describe('ConfirmationDialog', () => {
  it('should not render when closed', async () => {
    // Arrange
    const { renderComponent, alertApi } = setup();
    const props: jest.Mocked<ConfirmationDialogProps> = {
      completed: jest.fn(),
      content: 'Some text for the dialog',
      submit: jest.fn(),
      title: 'Confirm something',
      open: false,
    };

    // Act
    const result = await renderComponent(props);

    // Assert
    expect(result.baseElement).toMatchSnapshot();
    expect(props.completed.mock.calls).toMatchObject([]);
    expect(props.submit.mock.calls).toMatchObject([]);
    expect(alertApi.alert$).not.toHaveBeenCalled();
    expect(alertApi.post).not.toHaveBeenCalled();
  });

  it('should render when open', async () => {
    // Arrange
    const { renderComponent, alertApi } = setup();
    const props: jest.Mocked<ConfirmationDialogProps> = {
      completed: jest.fn(),
      content: 'Some text for the dialog',
      submit: jest.fn(),
      title: 'Confirm something',
      open: true,
    };

    // Act
    const result = await renderComponent(props);

    // Assert
    expect(result.baseElement).toMatchSnapshot();
    expect(props.completed.mock.calls).toMatchObject([]);
    expect(props.submit.mock.calls).toMatchObject([]);
    expect(alertApi.alert$).not.toHaveBeenCalled();
    expect(alertApi.post).not.toHaveBeenCalled();
  });

  it('should call completed when Cancel is clicked', async () => {
    // Arrange
    const { renderComponent, alertApi } = setup();
    const props: jest.Mocked<ConfirmationDialogProps> = {
      completed: jest.fn(),
      content: 'Some text for the dialog',
      submit: jest.fn(),
      title: 'Confirm something',
      open: true,
    };

    // Act
    const result = await renderComponent(props);
    await userEvent.click(
      result.getByTestId('confirmation-modal-cancel-button'),
    );

    // Assert
    expect(result.baseElement).toMatchSnapshot();
    expect(props.completed.mock.calls).toMatchObject([[undefined]]);
    expect(props.submit.mock.calls).toMatchObject([]);
    expect(alertApi.alert$).not.toHaveBeenCalled();
    expect(alertApi.post).not.toHaveBeenCalled();
  });

  it('should call submit when Confirm is clicked', async () => {
    // Arrange
    const { renderComponent, alertApi } = setup();
    const props: jest.Mocked<ConfirmationDialogProps> = {
      completed: jest.fn(),
      content: 'Some text for the dialog',
      submit: jest.fn(),
      title: 'Confirm something',
      open: true,
    };
    props.submit.mockReturnValueOnce(new Promise(() => {}));

    // Act
    const result = await renderComponent(props);
    await userEvent.click(
      result.getByTestId('confirmation-modal-confirm-button'),
    );

    // Assert
    expect(result.baseElement).toMatchSnapshot();
    expect(props.completed.mock.calls).toMatchObject([]);
    expect(props.submit.mock.calls).toMatchObject([[]]);
    expect(alertApi.alert$).not.toHaveBeenCalled();
    expect(alertApi.post).not.toHaveBeenCalled();
  });

  it('should raise an alert when submitting throws an error', async () => {
    // Arrange
    const { renderComponent, alertApi } = setup();
    const props: jest.Mocked<ConfirmationDialogProps> = {
      completed: jest.fn(),
      content: 'Some text for the dialog',
      submit: jest.fn(),
      title: 'Confirm something',
      open: true,
    };
    const expectedError = new Error('it broke');
    let finishSubmit: (error: unknown) => void = null!;
    props.submit.mockReturnValueOnce(
      new Promise((_, rej) => (finishSubmit = rej)),
    );

    // Act
    const result = await renderComponent(props);
    await userEvent.click(
      result.getByTestId('confirmation-modal-confirm-button'),
    );

    // Assert
    expect(result.baseElement).toMatchSnapshot('Submitting');
    expect(props.completed.mock.calls).toMatchObject([]);
    expect(props.submit.mock.calls).toMatchObject([[]]);
    expect(alertApi.alert$).not.toHaveBeenCalled();
    expect(alertApi.post).not.toHaveBeenCalled();

    finishSubmit(expectedError);
    await waitFor(() =>
      expect(alertApi.post.mock.calls).toMatchObject([
        [
          {
            message: 'Error: it broke',
            severity: 'error',
            display: 'transient',
          },
        ],
      ]),
    );
    expect(result.baseElement).toMatchSnapshot('Submitted');
    expect(props.completed.mock.calls).toMatchObject([]);
    expect(props.submit.mock.calls).toMatchObject([[]]);
    expect(alertApi.alert$).not.toHaveBeenCalled();
  });
});
