import React from 'react';
import { fireEvent, waitFor, act } from '@testing-library/react';
import CreateAlb from './CreateAlb';
import {
  alertApiRef,
  discoveryApiRef,
  errorApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import { TestApiProvider, renderInTestApp } from '@backstage/test-utils';
import {
  PermissionApi,
  permissionApiRef,
} from '@backstage/plugin-permission-react';
import { AuthorizeResult } from '@backstage/plugin-permission-common';

const mockAlertApi = { post: jest.fn() };
const mockErrorApi = { post: jest.fn() };
const mockDiscoveryApi = { getBaseUrl: jest.fn() };
const mockFetchApi = { fetch: jest.fn() };

const mockAuthorize = jest
  .fn()
  .mockImplementation(async () => ({ result: AuthorizeResult.ALLOW }));
const permissionApi: Partial<PermissionApi> = { authorize: mockAuthorize };

jest.mock('@backstage/plugin-permission-react', () => ({
  ...jest.requireActual('@backstage/plugin-permission-react'),
  usePermission: jest.fn().mockReturnValue({ allowed: true }),
}));

const mockGetArmsLengthBodies = jest.fn();
const mockCreateArmsLengthBody = jest.fn().mockResolvedValue({});
const mockRefetchArmsLengthBody = jest.fn();
jest.mock('./api/AlbClient', () => ({
  ArmsLengthBodyClient: jest.fn().mockImplementation(() => ({
    getArmsLengthBodies: mockGetArmsLengthBodies,
    createArmsLengthBody: mockCreateArmsLengthBody,
  })),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthorize.mockClear();
});

describe('CreateAlb', () => {
  const element = (
    <TestApiProvider
      apis={[
        [alertApiRef, mockAlertApi],
        [errorApiRef, mockErrorApi],
        [discoveryApiRef, mockDiscoveryApi],
        [fetchApiRef, mockFetchApi],
        [permissionApiRef, permissionApi],
      ]}
    >
      <CreateAlb refetchArmsLengthBody={mockRefetchArmsLengthBody} />
    </TestApiProvider>
  );
  const render = async () => renderInTestApp(element);

  afterEach(() => {
    mockGetArmsLengthBodies.mockReset();
  });

  it('closes the "Add ALB" modal when cancel button is clicked', async () => {
    const rendered = await render();

    act(() => {
      fireEvent.click(rendered.getByTestId('create-alb-button'));
    });

    act(() => {
      fireEvent.click(rendered.getByTestId('edit-modal-cancel-button'));
    });

    await waitFor(() => {
      expect(rendered.queryByText('Create:')).not.toBeInTheDocument();
    });
  });

  it('Add ALB can create an Arms Length Body', async () => {
    const updatedTableData = [
      { title: 'ALB 1', description: 'Description for ALB 1' },
    ];

    const rendered = await render();

    act(() => {
      fireEvent.click(rendered.getByTestId('create-alb-button'));
    });

    act(() => {
      fireEvent.change(rendered.getByLabelText('Title'), {
        target: { value: 'ALB 1' },
      });
      fireEvent.change(rendered.getByLabelText('ALB Description'), {
        target: { value: 'Description for ALB 1' },
      });
    });

    act(() => {
      fireEvent.click(rendered.getByTestId('edit-modal-update-button'));
    });

    mockGetArmsLengthBodies.mockResolvedValue(updatedTableData);

    await waitFor(() => {
      expect(mockCreateArmsLengthBody).toHaveBeenCalledWith({
        description: 'Description for ALB 1',
        short_name: '',
        title: 'ALB 1',
        url: '',
      });
      expect(mockAlertApi.post).toHaveBeenNthCalledWith(1, {
        display: 'transient',
        message: 'ALB created successfully.',
        severity: 'success',
      });
    });
  });

  it('Add ALB Creation fails and triggers error handling', async () => {
    mockCreateArmsLengthBody.mockRejectedValue(new Error('Creation Failed'));

    const rendered = await render();

    act(() => {
      fireEvent.click(rendered.getByTestId('create-alb-button'));
    });

    act(() => {
      fireEvent.change(rendered.getByLabelText('Title'), {
        target: { value: 'ALB 1' },
      });
      fireEvent.change(rendered.getByLabelText('ALB Description'), {
        target: { value: 'Description for ALB 1' },
      });
    });

    act(() => {
      fireEvent.click(rendered.getByTestId('edit-modal-update-button'));
    });

    await waitFor(() => {
      expect(mockCreateArmsLengthBody).toHaveBeenCalledWith({
        description: 'Description for ALB 1',
        short_name: '',
        title: 'ALB 1',
        url: '',
      });

      expect(mockErrorApi.post).toHaveBeenCalledWith(expect.any(Error));

      expect(mockAlertApi.post).toHaveBeenNthCalledWith(1, {
        display: 'permanent',
        message:
          "The name 'ALB 1' is already in use. Please choose a different name.",
        severity: 'error',
      });
    });
  });
});
