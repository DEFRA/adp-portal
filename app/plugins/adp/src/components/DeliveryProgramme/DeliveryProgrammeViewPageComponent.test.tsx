import React from 'react';

import { Button } from '@material-ui/core';
import { TestApiProvider, renderInTestApp } from '@backstage/test-utils';
import { DeliveryProgrammeApi, deliveryProgrammeApiRef } from './api';
import { ErrorApi, errorApiRef } from '@backstage/core-plugin-api';
import { DeliveryProgrammeViewPageComponent } from './DeliveryProgrammeViewPageComponent';
import { waitFor } from '@testing-library/react';
import { DeliveryProgramme } from '@internal/plugin-adp-common';

beforeEach(() => {
  jest.spyOn(global.Math, 'random').mockReturnValue(0);

  CreateDeliveryProgrammeButton.mockImplementation(
    ({ onCreated, ...props }) => <Button {...props} onClick={onCreated} />,
  );
  EditDeliveryProgrammeButton.mockImplementation(
    ({ deliveryProgramme, onEdited, ...props }) => (
      <div>
        {JSON.stringify(noTableData(deliveryProgramme))}
        <Button {...props} onClick={onEdited} />
      </div>
    ),
  );
});

afterEach(() => {
  jest.spyOn(global.Math, 'random').mockRestore();
  jest.resetAllMocks();
});

describe('DeliveryProgrammeViewPageComponent', () => {
  function setup() {
    const mockErrorApi: jest.Mocked<ErrorApi> = {
      error$: jest.fn(),
      post: jest.fn(),
    };
    const mockDeliveryProgrammeApi: jest.Mocked<DeliveryProgrammeApi> = {
      createDeliveryProgramme: jest.fn(),
      getDeliveryProgrammeAdmins: jest.fn(),
      getDeliveryProgrammeById: jest.fn(),
      updateDeliveryProgramme: jest.fn(),
      getDeliveryProgrammes: jest.fn(),
    };

    return {
      mockErrorApi,
      mockDeliveryProgrammeApi,
      async render() {
        const result = await renderInTestApp(
          <TestApiProvider
            apis={[
              [errorApiRef, mockErrorApi],
              [deliveryProgrammeApiRef, mockDeliveryProgrammeApi],
            ]}
          >
            <DeliveryProgrammeViewPageComponent />
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

  it('Should render the page with many programmes correctly', async () => {
    // arrange
    const { render, mockDeliveryProgrammeApi, mockErrorApi } = setup();
    const programmes = createDeliveryProgrammes(17);

    mockDeliveryProgrammeApi.getDeliveryProgrammes.mockResolvedValueOnce(
      programmes,
    );

    // act
    const rendered = await render();

    // assert
    expect(rendered).toMatchSnapshot();
    expect(
      mockDeliveryProgrammeApi.getDeliveryProgrammes.mock.calls,
    ).toMatchObject([[]]);
    expect(mockErrorApi.post.mock.calls).toMatchObject([]);
    expect(mockErrorApi.error$.mock.calls).toMatchObject([]);
    assertEditDeliveryProgrammeButtonCalls(programmes.slice(0, 5));
  });

  it('Should render the page with no programmes correctly', async () => {
    // arrange
    const { render, mockDeliveryProgrammeApi, mockErrorApi } = setup();
    mockDeliveryProgrammeApi.getDeliveryProgrammes.mockResolvedValueOnce([]);

    // act
    const rendered = await render();

    // assert
    expect(rendered).toMatchSnapshot();
    expect(
      mockDeliveryProgrammeApi.getDeliveryProgrammes.mock.calls,
    ).toMatchObject([[]]);
    expect(mockErrorApi.post.mock.calls).toMatchObject([]);
    expect(mockErrorApi.error$.mock.calls).toMatchObject([]);
    expect(EditDeliveryProgrammeButton.mock.calls).toMatchObject([]);
  });

  it('Should render the page when the programmes fail to load correctly', async () => {
    // arrange
    const { render, mockDeliveryProgrammeApi, mockErrorApi } = setup();
    const error = new Error();
    mockDeliveryProgrammeApi.getDeliveryProgrammes.mockRejectedValueOnce(error);

    // act
    const rendered = await render();

    // assert
    expect(rendered).toMatchSnapshot();
    expect(
      mockDeliveryProgrammeApi.getDeliveryProgrammes.mock.calls,
    ).toMatchObject([[]]);
    expect(mockErrorApi.post.mock.calls).toMatchObject([[error]]);
    expect(mockErrorApi.error$.mock.calls).toMatchObject([]);
    expect(EditDeliveryProgrammeButton.mock.calls).toMatchObject([]);
  });

  it('Should refresh when a programme is created', async () => {
    // arrange
    const { render, mockDeliveryProgrammeApi, mockErrorApi } = setup();
    const programmes = createDeliveryProgrammes(1);
    mockDeliveryProgrammeApi.getDeliveryProgrammes
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(programmes);

    // act
    const rendered = await render();

    expect(rendered).toMatchSnapshot('initial load');
    expect(
      mockDeliveryProgrammeApi.getDeliveryProgrammes.mock.calls,
    ).toMatchObject([[]]);
    expect(mockErrorApi.post.mock.calls).toMatchObject([]);
    expect(mockErrorApi.error$.mock.calls).toMatchObject([]);
    expect(EditDeliveryProgrammeButton.mock.calls).toMatchObject([]);

    rendered.getByTestId('delivery-programme-add-button').click();

    await waitFor(() =>
      expect(
        mockDeliveryProgrammeApi.getDeliveryProgrammes.mock.calls,
      ).toMatchObject([[], []]),
    );

    expect(rendered).toMatchSnapshot('after create');
    expect(mockErrorApi.post.mock.calls).toMatchObject([]);
    expect(mockErrorApi.error$.mock.calls).toMatchObject([]);
    assertEditDeliveryProgrammeButtonCalls(programmes);
  });

  it('Should refresh when a programme is edited', async () => {
    // arrange
    const { render, mockDeliveryProgrammeApi, mockErrorApi } = setup();
    const programmes = createDeliveryProgrammes(2);
    mockDeliveryProgrammeApi.getDeliveryProgrammes
      .mockResolvedValueOnce(programmes.slice(0, 1))
      .mockResolvedValueOnce(programmes);

    // act
    const rendered = await render();

    expect(rendered).toMatchSnapshot('initial load');
    expect(
      mockDeliveryProgrammeApi.getDeliveryProgrammes.mock.calls,
    ).toMatchObject([[]]);
    expect(mockErrorApi.post.mock.calls).toMatchObject([]);
    expect(mockErrorApi.error$.mock.calls).toMatchObject([]);
    assertEditDeliveryProgrammeButtonCalls(programmes.slice(0, 1));

    rendered.getByTestId('delivery-programme-edit-button-0').click();

    await waitFor(() =>
      expect(
        mockDeliveryProgrammeApi.getDeliveryProgrammes.mock.calls,
      ).toMatchObject([[], []]),
    );

    expect(rendered).toMatchSnapshot('after edit');
    expect(mockErrorApi.post.mock.calls).toMatchObject([]);
    expect(mockErrorApi.error$.mock.calls).toMatchObject([]);
    assertEditDeliveryProgrammeButtonCalls([programmes[0], ...programmes]);
  });
});

let EditDeliveryProgrammeButton: jest.MockedFn<
  typeof import('./EditDeliveryProgrammeButton').EditDeliveryProgrammeButton
> = jest.fn();
jest.mock(
  './EditDeliveryProgrammeButton',
  () =>
    ({
      get EditDeliveryProgrammeButton() {
        return EditDeliveryProgrammeButton;
      },
    } satisfies typeof import('./EditDeliveryProgrammeButton')),
);

let CreateDeliveryProgrammeButton: jest.MockedFn<
  typeof import('./CreateDeliveryProgrammeButton').CreateDeliveryProgrammeButton
> = jest.fn();
jest.mock(
  './CreateDeliveryProgrammeButton',
  () =>
    ({
      get CreateDeliveryProgrammeButton() {
        return CreateDeliveryProgrammeButton;
      },
    } satisfies typeof import('./CreateDeliveryProgrammeButton')),
);

function noTableData(value: unknown) {
  if (typeof value !== 'object' || value === null) return value;
  const { tableData, ...result } = value as Record<string, unknown>;
  return result;
}

function assertEditDeliveryProgrammeButtonCalls(
  programmes: DeliveryProgramme[],
) {
  expect(
    EditDeliveryProgrammeButton.mock.calls.map(
      ([{ deliveryProgramme, onEdited, ...props }, ...rest]) => [
        { ...props, deliveryProgramme: noTableData(deliveryProgramme) },
        ...rest,
      ],
    ),
  ).toMatchObject(
    programmes.map(p => [
      {
        children: 'Edit',
        color: 'default',
        'data-testid': `delivery-programme-edit-button-${p.id}`,
        variant: 'contained',
        deliveryProgramme: p,
      },
      {},
    ]),
  );
}

function createDeliveryProgrammes(count: number) {
  return [...new Array(count)].map<DeliveryProgramme>((_, i) => ({
    arms_length_body_id: '123',
    created_at: new Date(0),
    delivery_programme_code: 'ABC',
    description: 'My description',
    id: i.toString(),
    name: 'programme-' + i,
    programme_managers: [],
    title: 'Programme ' + i,
    updated_at: new Date(0),
    alias: 'Cool',
    children: [],
    updated_by: 'Someone else',
    url: 'https://test.com',
  }));
}
