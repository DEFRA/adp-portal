import React from 'react';

import { Button } from '@material-ui/core';
import { TestApiProvider, renderInTestApp } from '@backstage/test-utils';
import { DeliveryProgrammeApi, deliveryProgrammeApiRef } from './api';
import { ErrorApi, errorApiRef } from '@backstage/core-plugin-api';
import { DeliveryProgrammeViewPageComponent } from './DeliveryProgrammeViewPageComponent';
import { waitFor } from '@testing-library/react';

jest.mock(
  './EditDeliveryProgrammeButton',
  () =>
    ({
      EditDeliveryProgrammeButton: ({ deliveryProgramme, ...props }) => (
        <div>
          {JSON.stringify(noTableData(deliveryProgramme))} <Button {...props} />
        </div>
      ),
    } satisfies typeof import('./EditDeliveryProgrammeButton')),
);
jest.mock(
  './CreateDeliveryProgrammeButton',
  () =>
    ({
      CreateDeliveryProgrammeButton: ({ onCreated, ...props }) => (
        <Button {...props} />
      ),
    } satisfies typeof import('./CreateDeliveryProgrammeButton')),
);

function noTableData(value: Record<string, unknown>) {
  const { tableData, ...result } = value;
  return result;
}

beforeEach(() => {
  jest.spyOn(global.Math, 'random').mockReturnValue(0);
});

afterEach(() => {
  jest.spyOn(global.Math, 'random').mockRestore();
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

  it('Should render the page correctly', async () => {
    // arrange
    const { render, mockDeliveryProgrammeApi, mockErrorApi } = setup();
    mockDeliveryProgrammeApi.getDeliveryProgrammes.mockResolvedValueOnce([
      {
        arms_length_body_id: '123',
        created_at: new Date(0),
        delivery_programme_code: 'ABC',
        description: 'My description',
        id: '123',
        name: 'programme-1',
        programme_managers: [],
        title: 'Programme 1',
        updated_at: new Date(0),
        alias: 'Cool',
        children: [],
        updated_by: 'Someone else',
        url: 'https://test.com',
      },
      {
        arms_length_body_id: '123',
        created_at: new Date(0),
        delivery_programme_code: 'ABC',
        description: 'My description',
        id: '456',
        name: 'programme-2',
        programme_managers: [],
        title: 'Programme 2',
        updated_at: new Date(0),
        alias: 'Cool',
        children: [],
        updated_by: 'Someone else',
        url: 'https://test.com',
      },
      {
        arms_length_body_id: '123',
        created_at: new Date(0),
        delivery_programme_code: 'ABC',
        description: 'My description',
        id: '789',
        name: 'programme-3',
        programme_managers: [],
        title: 'Programme 3',
        updated_at: new Date(0),
        alias: 'Cool',
        children: [],
        updated_by: 'Someone else',
        url: 'https://test.com',
      },
    ]);

    // act
    const rendered = await render();

    // assert
    expect(rendered).toMatchSnapshot();
    expect(
      mockDeliveryProgrammeApi.getDeliveryProgrammes.mock.calls,
    ).toMatchObject([[]]);
    expect(mockErrorApi.post.mock.calls).toMatchObject([]);
    expect(mockErrorApi.error$.mock.calls).toMatchObject([]);
  });
});
