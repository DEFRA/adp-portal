import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import {
  transformedData,
  useProgrammeManagersList,
} from './useProgrammeManagersList';
import { TestApiProvider } from '@backstage/test-utils';
import {
  errorApiRef,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';

const mockDiscoveryApi = { getBaseUrl: jest.fn() };
const mockFetchApi = { fetch: jest.fn() };
const mockErrorApi = { post: jest.fn() };

describe('useProgrammeManagersList', () => {
  it('fetches and formats programme managers data correctly', async () => {
    mockDiscoveryApi.getBaseUrl.mockResolvedValue('http://localhost/adp');
    mockFetchApi.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        items: [
          {
            metadata: {
              name: 'user:default/jane_doe_defra',
              annotations: { 'graph.microsoft.com/user-id': 'testUserId1' },
            },
            spec: {
              profile: {
                displayName: 'Jane Doe (guest)',
              },
            },
          },
          {
            metadata: {
              name: 'user:default/john_doe_defra',
              annotations: { 'graph.microsoft.com/user-id': 'testUserId2' },
            },
            spec: {
              profile: {
                displayName: 'John Doe (guest)',
              },
            },
          },
        ],
      }),
    });

    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <TestApiProvider
        apis={[
          [errorApiRef, mockErrorApi],
          [discoveryApiRef, mockDiscoveryApi],
          [fetchApiRef, mockFetchApi],
        ]}
      >
        {children}
      </TestApiProvider>
    );

    const { result, waitForNextUpdate } = renderHook(
      () => useProgrammeManagersList(),
      { wrapper },
    );

    await waitForNextUpdate();

    expect(mockDiscoveryApi.getBaseUrl).toHaveBeenCalledWith('adp');
    expect(mockFetchApi.fetch).toHaveBeenCalledWith(
      'http://localhost/adp/catalogentities',
    );
    expect(result.current).toEqual([
      { label: 'Jane Doe (guest)', value: 'testUserId1' },
      { label: 'John Doe (guest)', value: 'testUserId2' },
    ]);
  });
});

describe('transformedData', () => {
  it('should transform Programme.managers into an array of objects with id properties', async () => {
    const mockProgramme = {
      programme_managers: ['123', '456'],
    };

    const result = await transformedData(mockProgramme);

    expect(result).toHaveProperty('programme_managers');
    expect(result.programme_managers).toEqual([
      { aad_entity_ref_id: '123' },
      { aad_entity_ref_id: '456' },
    ]);
  });
});
