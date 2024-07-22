import type { FetchApi } from '@backstage/core-plugin-api';
import { AdpDataTechRadarApi } from './techradardata';
import { ConfigReader } from '@backstage/config';

describe('AdpDataTechRadarApi', () => {
  const mockData = {
    entries: [
      {
        id: '1',
        title: 'value 1',
        description: 'value',
        key: '1',
        url: '#value',
        quadrant: 'value',
        timeline: [
          {
            date: new Date('2024-01-01'),
            moved: '0',
            ringId: 'value',
            description: '.',
          },
        ],
      },
    ],
  };

  it('should fetch data successfully', async () => {
    const config = new ConfigReader({
      techRadar: {
        data: 'value',
      },
    });
    const mockFetchApi: jest.Mocked<FetchApi> = {
      fetch: jest.fn(),
    };
    mockFetchApi.fetch.mockImplementation(() => {
      return Promise.resolve(
        new Response(JSON.stringify(mockData), {
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );
    });

    const techradarapi = new AdpDataTechRadarApi(config, mockFetchApi);
    const data = await techradarapi.load();

    expect(mockFetchApi.fetch).toHaveBeenCalledWith('value');
    expect(data).toEqual(mockData);
  });
});
