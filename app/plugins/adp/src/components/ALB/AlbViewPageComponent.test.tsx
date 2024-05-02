import React from 'react';

import { Button } from '@material-ui/core';
import { TestApiProvider, renderInTestApp } from '@backstage/test-utils';
import { ArmsLengthBodyApi, armsLengthBodyApiRef } from './api';
import { ErrorApi, errorApiRef } from '@backstage/core-plugin-api';
import { AlbViewPageComponent } from './AlbViewPageComponent';
import { waitFor } from '@testing-library/react';
import { ArmsLengthBody } from '@internal/plugin-adp-common';

beforeEach(() => {
  jest.spyOn(global.Math, 'random').mockReturnValue(0);

  CreateAlbButton.mockImplementation(({ onCreated, ...props }) => (
    <Button {...props} onClick={onCreated} />
  ));
  EditAlbButton.mockImplementation(({ armsLengthBody, onEdited, ...props }) => (
    <div>
      {JSON.stringify(noTableData(armsLengthBody))}
      <Button {...props} onClick={onEdited} />
    </div>
  ));
});

afterEach(() => {
  jest.spyOn(global.Math, 'random').mockRestore();
  jest.resetAllMocks();
});

describe('ArmsLengthBodyViewPageComponent', () => {
  function setup() {
    const mockErrorApi: jest.Mocked<ErrorApi> = {
      error$: jest.fn(),
      post: jest.fn(),
    };
    const mockArmsLengthBodyApi: jest.Mocked<ArmsLengthBodyApi> = {
      createArmsLengthBody: jest.fn(),
      getArmsLengthBodies: jest.fn(),
      updateArmsLengthBody: jest.fn(),
      getArmsLengthBodyNames: jest.fn(),
    };

    return {
      mockErrorApi,
      mockArmsLengthBodyApi,
      async render() {
        const result = await renderInTestApp(
          <TestApiProvider
            apis={[
              [errorApiRef, mockErrorApi],
              [armsLengthBodyApiRef, mockArmsLengthBodyApi],
            ]}
          >
            <AlbViewPageComponent />
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
    const { render, mockArmsLengthBodyApi, mockErrorApi } = setup();
    const projects = createArmsLengthBodys(17);

    mockArmsLengthBodyApi.getArmsLengthBodies.mockResolvedValueOnce(projects);

    // act
    const rendered = await render();

    // assert
    expect(rendered.baseElement).toMatchSnapshot();
    expect(mockArmsLengthBodyApi.getArmsLengthBodies.mock.calls).toMatchObject([
      [],
    ]);
    expect(mockErrorApi.post.mock.calls).toMatchObject([]);
    expect(mockErrorApi.error$.mock.calls).toMatchObject([]);
    assertEditArmsLengthBodyButtonCalls(projects.slice(0, 5));
  });

  it('Should render the page with no projects correctly', async () => {
    // arrange
    const { render, mockArmsLengthBodyApi, mockErrorApi } = setup();
    mockArmsLengthBodyApi.getArmsLengthBodies.mockResolvedValueOnce([]);

    // act
    const rendered = await render();

    // assert
    expect(rendered.baseElement).toMatchSnapshot();
    expect(mockArmsLengthBodyApi.getArmsLengthBodies.mock.calls).toMatchObject([
      [],
    ]);
    expect(mockErrorApi.post.mock.calls).toMatchObject([]);
    expect(mockErrorApi.error$.mock.calls).toMatchObject([]);
    expect(EditAlbButton.mock.calls).toMatchObject([]);
  });

  it('Should render the page when the projects fail to load correctly', async () => {
    // arrange
    const { render, mockArmsLengthBodyApi, mockErrorApi } = setup();
    const error = new Error();
    mockArmsLengthBodyApi.getArmsLengthBodies.mockRejectedValueOnce(error);

    // act
    const rendered = await render();

    // assert
    expect(rendered.baseElement).toMatchSnapshot();
    expect(mockArmsLengthBodyApi.getArmsLengthBodies.mock.calls).toMatchObject([
      [],
    ]);
    expect(mockErrorApi.post.mock.calls).toMatchObject([[error]]);
    expect(mockErrorApi.error$.mock.calls).toMatchObject([]);
    expect(EditAlbButton.mock.calls).toMatchObject([]);
  });

  it('Should refresh when a project is created', async () => {
    // arrange
    const { render, mockArmsLengthBodyApi, mockErrorApi } = setup();
    const projects = createArmsLengthBodys(1);
    mockArmsLengthBodyApi.getArmsLengthBodies
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(projects);

    // act
    const rendered = await render();

    expect(rendered.baseElement).toMatchSnapshot('initial load');
    expect(mockArmsLengthBodyApi.getArmsLengthBodies.mock.calls).toMatchObject([
      [],
    ]);
    expect(mockErrorApi.post.mock.calls).toMatchObject([]);
    expect(mockErrorApi.error$.mock.calls).toMatchObject([]);
    expect(EditAlbButton.mock.calls).toMatchObject([]);

    rendered.getByTestId('alb-add-button').click();

    await waitFor(() =>
      expect(
        mockArmsLengthBodyApi.getArmsLengthBodies.mock.calls,
      ).toMatchObject([[], []]),
    );

    expect(rendered.baseElement).toMatchSnapshot('after create');
    expect(mockErrorApi.post.mock.calls).toMatchObject([]);
    expect(mockErrorApi.error$.mock.calls).toMatchObject([]);
    assertEditArmsLengthBodyButtonCalls(projects);
  });

  it('Should refresh when a project is edited', async () => {
    // arrange
    const { render, mockArmsLengthBodyApi, mockErrorApi } = setup();
    const projects = createArmsLengthBodys(2);
    mockArmsLengthBodyApi.getArmsLengthBodies
      .mockResolvedValueOnce(projects.slice(0, 1))
      .mockResolvedValueOnce(projects);

    // act
    const rendered = await render();

    expect(rendered.baseElement).toMatchSnapshot('initial load');
    expect(mockArmsLengthBodyApi.getArmsLengthBodies.mock.calls).toMatchObject([
      [],
    ]);
    expect(mockErrorApi.post.mock.calls).toMatchObject([]);
    expect(mockErrorApi.error$.mock.calls).toMatchObject([]);
    assertEditArmsLengthBodyButtonCalls(projects.slice(0, 1));

    rendered.getByTestId('alb-edit-button-0').click();

    await waitFor(() =>
      expect(
        mockArmsLengthBodyApi.getArmsLengthBodies.mock.calls,
      ).toMatchObject([[], []]),
    );

    expect(rendered.baseElement).toMatchSnapshot('after edit');
    expect(mockErrorApi.post.mock.calls).toMatchObject([]);
    expect(mockErrorApi.error$.mock.calls).toMatchObject([]);
    assertEditArmsLengthBodyButtonCalls([projects[0], ...projects]);
  });
});

let EditAlbButton: jest.MockedFn<
  typeof import('./EditAlbButton').EditAlbButton
> = jest.fn();
jest.mock(
  './EditAlbButton',
  () =>
    ({
      get EditAlbButton() {
        return EditAlbButton;
      },
    } satisfies typeof import('./EditAlbButton')),
);

let CreateAlbButton: jest.MockedFn<
  typeof import('./CreateAlbButton').CreateAlbButton
> = jest.fn();
jest.mock(
  './CreateAlbButton',
  () =>
    ({
      get CreateAlbButton() {
        return CreateAlbButton;
      },
    } satisfies typeof import('./CreateAlbButton')),
);

function noTableData(value: unknown) {
  if (typeof value !== 'object' || value === null) return value;
  const { tableData, ...result } = value as Record<string, unknown>;
  return result;
}

function assertEditArmsLengthBodyButtonCalls(projects: ArmsLengthBody[]) {
  expect(
    EditAlbButton.mock.calls.map(
      ([{ armsLengthBody, onEdited, ...props }, ...rest]) => [
        { ...props, armsLengthBody: noTableData(armsLengthBody) },
        ...rest,
      ],
    ),
  ).toMatchObject(
    projects.map(p => [
      {
        children: 'Edit',
        color: 'default',
        'data-testid': `alb-edit-button-${p.id}`,
        variant: 'contained',
        armsLengthBody: p,
      },
      {},
    ]),
  );
}

function createArmsLengthBodys(count: number) {
  return [...new Array(count)].map<ArmsLengthBody>((_, i) => ({
    id: i.toString(),
    name: 'project-' + i,
    title: 'Project ' + i,
    created_at: new Date(0),
    creator: 'me',
    description: 'My cool arms length body',
    owner: 'not me',
    updated_at: new Date(0),
    alias: 'ALB ' + i,
    children: [],
    updated_by: 'Me',
    url: 'https://test.com',
  }));
}
