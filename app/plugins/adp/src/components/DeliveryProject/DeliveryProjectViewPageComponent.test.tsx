import React from 'react';

import { Button } from '@material-ui/core';
import { TestApiProvider, renderInTestApp } from '@backstage/test-utils';
import { DeliveryProjectApi, deliveryProjectApiRef } from './api';
import { ErrorApi, errorApiRef } from '@backstage/core-plugin-api';
import { DeliveryProjectViewPageComponent } from './DeliveryProjectViewPageComponent';
import { waitFor } from '@testing-library/react';
import { DeliveryProject } from '@internal/plugin-adp-common';

beforeEach(() => {
  jest.spyOn(global.Math, 'random').mockReturnValue(0);

  CreateDeliveryProjectButton.mockImplementation(({ onCreated, ...props }) => (
    <Button {...props} onClick={onCreated} />
  ));
  EditDeliveryProjectButton.mockImplementation(
    ({ deliveryProject, onEdited, ...props }) => (
      <div>
        {JSON.stringify(noTableData(deliveryProject))}
        <Button {...props} onClick={onEdited} />
      </div>
    ),
  );
});

afterEach(() => {
  jest.spyOn(global.Math, 'random').mockRestore();
  jest.resetAllMocks();
});

describe('DeliveryProjectViewPageComponent', () => {
  function setup() {
    const mockErrorApi: jest.Mocked<ErrorApi> = {
      error$: jest.fn(),
      post: jest.fn(),
    };
    const mockDeliveryProjectApi: jest.Mocked<DeliveryProjectApi> = {
      createDeliveryProject: jest.fn(),
      getDeliveryProjectById: jest.fn(),
      updateDeliveryProject: jest.fn(),
      getDeliveryProjects: jest.fn(),
    };

    return {
      mockErrorApi,
      mockDeliveryProjectApi,
      async render() {
        const result = await renderInTestApp(
          <TestApiProvider
            apis={[
              [errorApiRef, mockErrorApi],
              [deliveryProjectApiRef, mockDeliveryProjectApi],
            ]}
          >
            <DeliveryProjectViewPageComponent />
          </TestApiProvider>,
        );

        await waitFor(() => {
          expect(
            result.getByText('Azure Development Platform: Onboarding'),
          ).toBeInTheDocument();
        });

        return result;
      },
    };
  }

  it('Should render the page with many projects correctly', async () => {
    // arrange
    const { render, mockDeliveryProjectApi, mockErrorApi } = setup();
    const projects = createDeliveryProjects(17);

    mockDeliveryProjectApi.getDeliveryProjects.mockResolvedValueOnce(projects);

    // act
    const rendered = await render();

    // assert
    expect(rendered.baseElement).toMatchSnapshot();
    expect(mockDeliveryProjectApi.getDeliveryProjects.mock.calls).toMatchObject(
      [[]],
    );
    expect(mockErrorApi.post.mock.calls).toMatchObject([]);
    expect(mockErrorApi.error$.mock.calls).toMatchObject([]);
    assertEditDeliveryProjectButtonCalls(projects.slice(0, 5));
  });

  it('Should render the page with no projects correctly', async () => {
    // arrange
    const { render, mockDeliveryProjectApi, mockErrorApi } = setup();
    mockDeliveryProjectApi.getDeliveryProjects.mockResolvedValueOnce([]);

    // act
    const rendered = await render();

    // assert
    expect(rendered.baseElement).toMatchSnapshot();
    expect(mockDeliveryProjectApi.getDeliveryProjects.mock.calls).toMatchObject(
      [[]],
    );
    expect(mockErrorApi.post.mock.calls).toMatchObject([]);
    expect(mockErrorApi.error$.mock.calls).toMatchObject([]);
    expect(EditDeliveryProjectButton.mock.calls).toMatchObject([]);
  });

  it('Should render the page when the projects fail to load correctly', async () => {
    // arrange
    const { render, mockDeliveryProjectApi, mockErrorApi } = setup();
    const error = new Error();
    mockDeliveryProjectApi.getDeliveryProjects.mockRejectedValueOnce(error);

    // act
    const rendered = await render();

    // assert
    expect(rendered.baseElement).toMatchSnapshot();
    expect(mockDeliveryProjectApi.getDeliveryProjects.mock.calls).toMatchObject(
      [[]],
    );
    expect(mockErrorApi.post.mock.calls).toMatchObject([[error]]);
    expect(mockErrorApi.error$.mock.calls).toMatchObject([]);
    expect(EditDeliveryProjectButton.mock.calls).toMatchObject([]);
  });

  it('Should refresh when a project is created', async () => {
    // arrange
    const { render, mockDeliveryProjectApi, mockErrorApi } = setup();
    const projects = createDeliveryProjects(1);
    mockDeliveryProjectApi.getDeliveryProjects
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(projects);

    // act
    const rendered = await render();

    expect(rendered.baseElement).toMatchSnapshot('initial load');
    expect(mockDeliveryProjectApi.getDeliveryProjects.mock.calls).toMatchObject(
      [[]],
    );
    expect(mockErrorApi.post.mock.calls).toMatchObject([]);
    expect(mockErrorApi.error$.mock.calls).toMatchObject([]);
    expect(EditDeliveryProjectButton.mock.calls).toMatchObject([]);

    rendered.getByTestId('delivery-project-add-button').click();

    await waitFor(() =>
      expect(
        mockDeliveryProjectApi.getDeliveryProjects.mock.calls,
      ).toMatchObject([[], []]),
    );

    expect(rendered.baseElement).toMatchSnapshot('after create');
    expect(mockErrorApi.post.mock.calls).toMatchObject([]);
    expect(mockErrorApi.error$.mock.calls).toMatchObject([]);
    assertEditDeliveryProjectButtonCalls(projects);
  });

  it('Should refresh when a project is edited', async () => {
    // arrange
    const { render, mockDeliveryProjectApi, mockErrorApi } = setup();
    const projects = createDeliveryProjects(2);
    mockDeliveryProjectApi.getDeliveryProjects
      .mockResolvedValueOnce(projects.slice(0, 1))
      .mockResolvedValueOnce(projects);

    // act
    const rendered = await render();

    expect(rendered.baseElement).toMatchSnapshot('initial load');
    expect(mockDeliveryProjectApi.getDeliveryProjects.mock.calls).toMatchObject(
      [[]],
    );
    expect(mockErrorApi.post.mock.calls).toMatchObject([]);
    expect(mockErrorApi.error$.mock.calls).toMatchObject([]);
    assertEditDeliveryProjectButtonCalls(projects.slice(0, 1));

    rendered.getByTestId('delivery-project-edit-button-0').click();

    await waitFor(() =>
      expect(
        mockDeliveryProjectApi.getDeliveryProjects.mock.calls,
      ).toMatchObject([[], []]),
    );

    expect(rendered.baseElement).toMatchSnapshot('after edit');
    expect(mockErrorApi.post.mock.calls).toMatchObject([]);
    expect(mockErrorApi.error$.mock.calls).toMatchObject([]);
    assertEditDeliveryProjectButtonCalls([projects[0], ...projects]);
  });
});

let EditDeliveryProjectButton: jest.MockedFn<
  typeof import('./EditDeliveryProjectButton').EditDeliveryProjectButton
> = jest.fn();
jest.mock(
  './EditDeliveryProjectButton',
  () =>
    ({
      get EditDeliveryProjectButton() {
        return EditDeliveryProjectButton;
      },
    } satisfies typeof import('./EditDeliveryProjectButton')),
);

let CreateDeliveryProjectButton: jest.MockedFn<
  typeof import('./CreateDeliveryProjectButton').CreateDeliveryProjectButton
> = jest.fn();
jest.mock(
  './CreateDeliveryProjectButton',
  () =>
    ({
      get CreateDeliveryProjectButton() {
        return CreateDeliveryProjectButton;
      },
    } satisfies typeof import('./CreateDeliveryProjectButton')),
);

function noTableData(value: unknown) {
  if (typeof value !== 'object' || value === null) return value;
  const { tableData, ...result } = value as Record<string, unknown>;
  return result;
}

function assertEditDeliveryProjectButtonCalls(projects: DeliveryProject[]) {
  expect(
    EditDeliveryProjectButton.mock.calls.map(
      ([{ deliveryProject, onEdited, ...props }, ...rest]) => [
        { ...props, deliveryProject: noTableData(deliveryProject) },
        ...rest,
      ],
    ),
  ).toMatchObject(
    projects.map(p => [
      {
        children: 'Edit',
        color: 'default',
        'data-testid': `delivery-project-edit-button-${p.id}`,
        variant: 'contained',
        deliveryProject: p,
      },
      {},
    ]),
  );
}

function createDeliveryProjects(count: number) {
  return [...new Array(count)].map<DeliveryProject>((_, i) => ({
    id: i.toString(),
    name: 'project-' + i,
    title: 'Project ' + i,
    ado_project: 'My ado project',
    created_at: new Date(0),
    delivery_programme_code: 'ABC',
    delivery_programme_id: '123',
    delivery_project_code: 'DEF',
    description: 'My project',
    namespace: 'ABC-DEF',
    service_owner: 'test@email.com',
    team_type: 'delivery',
    updated_at: new Date(0),
    alias: 'Cool project',
    finance_code: 'Money number',
    github_team_visibility: 'public',
    updated_by: 'Me',
  }));
}
