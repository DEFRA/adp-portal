import React from 'react';

import { Button } from '@material-ui/core';
import { TestApiProvider, renderInTestApp } from '@backstage/test-utils';
import type { DeliveryProjectApi } from './api';
import { deliveryProjectApiRef } from './api';
import type { ErrorApi } from '@backstage/core-plugin-api';
import { errorApiRef } from '@backstage/core-plugin-api';
import { DeliveryProjectViewPageComponent } from './DeliveryProjectViewPageComponent';
import { type RenderResult, waitFor } from '@testing-library/react';
import type { DeliveryProject } from '@internal/plugin-adp-common';
import type * as EditDeliveryProjectButtonModule from './EditDeliveryProjectButton';
import type * as CreateDeliveryProjectButtonModule from './CreateDeliveryProjectButton';
import { SnapshotFriendlyStylesProvider } from '../../utils';
import { entityRouteRef } from '@backstage/plugin-catalog-react';
import { inspect } from 'node:util';

const EditDeliveryProjectButton: jest.MockedFn<
  (typeof EditDeliveryProjectButtonModule)['EditDeliveryProjectButton']
> = jest.fn();
const CreateDeliveryProjectButton: jest.MockedFn<
  (typeof CreateDeliveryProjectButtonModule)['CreateDeliveryProjectButton']
> = jest.fn();

beforeEach(() => {
  jest.spyOn(global.Math, 'random').mockReturnValue(0);

  CreateDeliveryProjectButton.mockImplementation(({ onCreated, ...props }) => (
    <Button {...props} onClick={onCreated} />
  ));
  EditDeliveryProjectButton.mockImplementation(
    ({ onEdited, deliveryProject, children, ...props }) => (
      <Button {...props} onClick={onEdited}>
        {children}
        {inspect(noTableData(deliveryProject))}
      </Button>
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
            <SnapshotFriendlyStylesProvider>
              <DeliveryProjectViewPageComponent />
            </SnapshotFriendlyStylesProvider>
          </TestApiProvider>,
          {
            mountedRoutes: {
              '/catalog/:namespace/:kind/:name/*': entityRouteRef,
            },
          },
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
    const error = new Error('My error');
    mockDeliveryProjectApi.getDeliveryProjects.mockRejectedValueOnce(error);

    // act
    const rendered = await render();

    // assert
    expect(rendered.baseElement).toMatchSnapshot();
    expect(mockDeliveryProjectApi.getDeliveryProjects.mock.calls).toMatchObject(
      [[]],
    );
    expect(mockErrorApi.post.mock.calls).toMatchObject([
      [
        {
          message: 'Error: My error',
          name: 'Error while getting the list of delivery projects.',
          stack: undefined,
        },
      ],
    ]);
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

    React.act(() =>
      rendered.getByTestId('delivery-project-add-button').click(),
    );

    await waitFor(() =>
      expect(
        mockDeliveryProjectApi.getDeliveryProjects.mock.calls,
      ).toMatchObject([[], []]),
    );
    await notLoading(rendered);

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

    React.act(() =>
      rendered.getByTestId('delivery-project-edit-button-0').click(),
    );

    await waitFor(() =>
      expect(
        mockDeliveryProjectApi.getDeliveryProjects.mock.calls,
      ).toMatchObject([[], []]),
    );
    await notLoading(rendered);

    expect(rendered.baseElement).toMatchSnapshot('after edit');
    expect(mockErrorApi.post.mock.calls).toMatchObject([]);
    expect(mockErrorApi.error$.mock.calls).toMatchObject([]);
    assertEditDeliveryProjectButtonCalls([projects[0], ...projects]);
  });
});

jest.mock(
  './EditDeliveryProjectButton',
  () =>
    ({
      get EditDeliveryProjectButton() {
        return EditDeliveryProjectButton;
      },
    }) satisfies typeof EditDeliveryProjectButtonModule,
);

jest.mock(
  './CreateDeliveryProjectButton',
  () =>
    ({
      get CreateDeliveryProjectButton() {
        return CreateDeliveryProjectButton;
      },
    }) satisfies typeof CreateDeliveryProjectButtonModule,
);

async function notLoading(rendered: RenderResult) {
  await waitFor(async () =>
    expect(
      await rendered.findByTestId('loading-indicator'),
    ).not.toBeInTheDocument(),
  );
}

function noTableData(value: unknown) {
  if (typeof value !== 'object' || value === null) return value;
  const { tableData, ...result } = value as Record<string, unknown>;
  return result;
}

function assertEditDeliveryProjectButtonCalls(projects: DeliveryProject[]) {
  expect(
    EditDeliveryProjectButton.mock.calls
      .map(([{ deliveryProject, onEdited, ...props }, ...rest]) => [
        { ...props, deliveryProject: noTableData(deliveryProject) },
        ...rest,
      ])
      .slice(-projects.length),
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
    name: `project-${i}`,
    title: `Project ${i}`,
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
    delivery_project_users: [],
    delivery_programme_admins: [],
  }));
}
