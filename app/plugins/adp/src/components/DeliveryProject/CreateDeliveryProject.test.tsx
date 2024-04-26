import React from 'react';
import { fireEvent, waitFor, act } from '@testing-library/react';
import CreateDeliveryProject from './CreateDeliveryProject';
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
import userEvent from '@testing-library/user-event';
import {
  isCodeUnique,
  isNameUnique,
} from '../../utils/DeliveryProject/DeliveryProjectUtils';

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

const mockGetDeliveryProjects = jest.fn().mockResolvedValue([]);
const mockCreateDeliveryProject = jest.fn().mockResolvedValue({});
const mockRefetchDeliveryProject = jest.fn().mockResolvedValue([]);
jest.mock('./api/DeliveryProjectClient', () => ({
  DeliveryProjectClient: jest.fn().mockImplementation(() => ({
    getDeliveryProjects: mockGetDeliveryProjects,
    createDeliveryProject: mockCreateDeliveryProject,
  })),
}));

jest.mock('../../hooks/useDeliveryProgrammesList', () => ({
  useDeliveryProgrammesList: jest.fn().mockReturnValue([
    {
      dropdownItem: { label: 'Programme1', value: '1' },
      programme: { id: '1', delivery_programme_code: 'prg' },
    },
  ]),
}));

jest.mock('../../utils/DeliveryProject/DeliveryProjectUtils', () => ({
  isCodeUnique: jest.fn().mockReturnValue(true),
  isNameUnique: jest.fn().mockReturnValue(true),
}));

describe('Create Delivery Project', () => {
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
      <CreateDeliveryProject
        refetchDeliveryProject={mockRefetchDeliveryProject}
      />
    </TestApiProvider>
  );
  const render = async () => renderInTestApp(element);
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthorize.mockClear();
  });
  afterEach(() => {
    mockGetDeliveryProjects.mockReset();
    mockCreateDeliveryProject.mockReset();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  it('closes the "Add Delivery Project" modal when cancel button is clicked', async () => {
    const rendered = await render();

    act(() => {
      fireEvent.click(rendered.getByTestId('create-delivery-project-button'));
    });

    act(() => {
      fireEvent.click(rendered.getByTestId('actions-modal-cancel-button'));
    });

    await waitFor(() => {
      expect(rendered.queryByText('Create:')).not.toBeInTheDocument();
    });
  });

  it('Add Delivery Project can create a Delivery Project', async () => {
    const updatedTableData = [
      {
        title: 'Project',
        delivery_programme_id: '1',
        description: 'Description 1',
        delivery_project_code: 'tst',
        team_type: 'delivery',
        service_owner: 'x@y.com',
        ado_project: 'defra-ffc',
        github_team_visibility: 'public',
        namespace: 'prg-tst',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    const rendered = await render();
    fireEvent.click(rendered.getByTestId('create-delivery-project-button'));
    fireEvent.change(rendered.getByLabelText('Title'), {
      target: { value: 'Project' },
    });

    fireEvent.change(rendered.getByLabelText('Delivery Project Description'), {
      target: { value: 'Description 1' },
    });

    const deliveryProgramme = rendered.getByLabelText('Delivery Programme');
    fireEvent.keyDown(deliveryProgramme, { key: 'ArrowDown' });
    fireEvent.click(rendered.getByText('Programme1'));

    const githubTeamVisibility = rendered.getByLabelText(
      'GitHub Team Visibility',
    );
    fireEvent.keyDown(githubTeamVisibility, { key: 'ArrowDown' });
    fireEvent.click(rendered.getByText('Publicly visible'));

    fireEvent.change(rendered.getByLabelText('Service Code'), {
      target: { value: 'tst' },
    });

    fireEvent.change(rendered.getByLabelText('Business Service Owner'), {
      target: { value: 'xyz@abc.com' },
    });

    fireEvent.change(rendered.getByLabelText('Cost Center'), {
      target: { value: 'abc' },
    });

    fireEvent.change(rendered.getByLabelText('ADO Project'), {
      target: { value: 'defra-ffc' },
    });

    await userEvent.click(rendered.getByTestId('actions-modal-update-button'));

    mockGetDeliveryProjects.mockResolvedValueOnce(updatedTableData);

    await waitFor(() => {
      expect(mockCreateDeliveryProject).toHaveBeenCalled();
      expect(mockAlertApi.post).toHaveBeenNthCalledWith(1, {
        display: 'transient',
        message: 'Delivery Project created successfully.',
        severity: 'success',
      });
    });
  });

  it('Add Delivery Project Creation fails and triggers error handling', async () => {
    mockCreateDeliveryProject.mockRejectedValue(new Error('Creation Failed'));

    const rendered = await render();
    fireEvent.click(rendered.getByTestId('create-delivery-project-button'));
    fireEvent.change(rendered.getByLabelText('Title'), {
      target: { value: 'Project' },
    });

    fireEvent.change(rendered.getByLabelText('Delivery Project Description'), {
      target: { value: 'Description 1' },
    });

    const deliveryProgramme = rendered.getByLabelText('Delivery Programme');
    fireEvent.keyDown(deliveryProgramme, { key: 'ArrowDown' });
    fireEvent.click(rendered.getByText('Programme1'));

    const githubTeamVisibility = rendered.getByLabelText(
      'GitHub Team Visibility',
    );
    fireEvent.keyDown(githubTeamVisibility, { key: 'ArrowDown' });
    fireEvent.click(rendered.getByText('Publicly visible'));

    fireEvent.change(rendered.getByLabelText('Service Code'), {
      target: { value: 'tst' },
    });

    fireEvent.change(rendered.getByLabelText('Business Service Owner'), {
      target: { value: 'xyz@abc.com' },
    });

    fireEvent.change(rendered.getByLabelText('Cost Center'), {
      target: { value: 'abc' },
    });

    fireEvent.change(rendered.getByLabelText('ADO Project'), {
      target: { value: 'defra-ffc' },
    });

    fireEvent.click(rendered.getByTestId('actions-modal-update-button'));

    await waitFor(() => {
      expect(mockCreateDeliveryProject).toHaveBeenCalled();
      expect(mockErrorApi.post).toHaveBeenCalledWith(expect.any(Error));
      expect(mockAlertApi.post).toHaveBeenCalled();
    });
  });

  it('Add Delivery Project Creation fails when project_code is not unique', async () => {
    (isCodeUnique as jest.Mock).mockReturnValue(false);
    const rendered = await render();
    fireEvent.click(rendered.getByTestId('create-delivery-project-button'));
    fireEvent.change(rendered.getByLabelText('Title'), {
      target: { value: 'Project' },
    });

    fireEvent.change(rendered.getByLabelText('Delivery Project Description'), {
      target: { value: 'Description 1' },
    });

    const deliveryProgramme = rendered.getByLabelText('Delivery Programme');
    fireEvent.keyDown(deliveryProgramme, { key: 'ArrowDown' });
    fireEvent.click(rendered.getByText('Programme1'));

    const githubTeamVisibility = rendered.getByLabelText(
      'GitHub Team Visibility',
    );
    fireEvent.keyDown(githubTeamVisibility, { key: 'ArrowDown' });
    fireEvent.click(rendered.getByText('Publicly visible'));

    fireEvent.change(rendered.getByLabelText('Service Code'), {
      target: { value: 'tst' },
    });

    fireEvent.change(rendered.getByLabelText('Business Service Owner'), {
      target: { value: 'xyz@abc.com' },
    });

    fireEvent.change(rendered.getByLabelText('Cost Center'), {
      target: { value: 'abc' },
    });

    fireEvent.change(rendered.getByLabelText('ADO Project'), {
      target: { value: 'defra-ffc' },
    });

    fireEvent.click(rendered.getByTestId('actions-modal-update-button'));

    await waitFor(() => {
      expect(mockAlertApi.post).toHaveBeenCalled();
    });
  });

  it('Add Delivery Project Creation fails when name is not unique', async () => {
    (isNameUnique as jest.Mock).mockReturnValue(false);
    const rendered = await render();
    fireEvent.click(rendered.getByTestId('create-delivery-project-button'));
    fireEvent.change(rendered.getByLabelText('Title'), {
      target: { value: 'Project' },
    });

    fireEvent.change(rendered.getByLabelText('Delivery Project Description'), {
      target: { value: 'Description 1' },
    });

    const deliveryProgramme = rendered.getByLabelText('Delivery Programme');
    fireEvent.keyDown(deliveryProgramme, { key: 'ArrowDown' });
    fireEvent.click(rendered.getByText('Programme1'));

    const githubTeamVisibility = rendered.getByLabelText(
      'GitHub Team Visibility',
    );
    fireEvent.keyDown(githubTeamVisibility, { key: 'ArrowDown' });
    fireEvent.click(rendered.getByText('Publicly visible'));

    fireEvent.change(rendered.getByLabelText('Service Code'), {
      target: { value: 'tst' },
    });

    fireEvent.change(rendered.getByLabelText('Business Service Owner'), {
      target: { value: 'xyz@abc.com' },
    });

    fireEvent.change(rendered.getByLabelText('Cost Center'), {
      target: { value: 'abc' },
    });

    fireEvent.change(rendered.getByLabelText('ADO Project'), {
      target: { value: 'defra-ffc' },
    });

    fireEvent.click(rendered.getByTestId('actions-modal-update-button'));

    await waitFor(() => {
      expect(mockAlertApi.post).toHaveBeenCalled();
    });
  });
});
