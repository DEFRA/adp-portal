import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { TestApiProvider } from '@backstage/test-utils';
import { useEntities } from './useEntities'; // Adjust the import path as necessary
import { errorApiRef} from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';




const mockErrorApi = { post: jest.fn() };
const mockCatalogApi = {
  getEntities: jest.fn().mockResolvedValue({
    items: [
      {
        metadata: { name: 'user1' },
        spec: { profile: { displayName: 'User One' } },
      },
      {
        metadata: { name: 'user2' },
       
      },
    ],
  }),
};

describe('useEntities', () => {
  it('fetches entities and transforms them to options', async () => {
    const wrapper: React.FC = ({ children }) => (
      <TestApiProvider
        apis={[
          [errorApiRef, mockErrorApi],
          [catalogApiRef, mockCatalogApi],
        ]}
      >
        {children}
      </TestApiProvider>
    );

    const { result, waitForNextUpdate } = renderHook(() => useEntities(), { wrapper });

    await waitForNextUpdate();

    expect(mockCatalogApi.getEntities).toHaveBeenCalledTimes(1);
    expect(result.current).toEqual([
      { label: 'User One', value: 'user1' },
      { label: 'Unknown', value: 'user2' },
    ]);
    expect(mockErrorApi.post).not.toHaveBeenCalled();
  });

})