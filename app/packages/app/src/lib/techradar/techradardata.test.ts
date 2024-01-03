import { AdpDataTechRadarApi } from './techradardata';
import { ConfigReader } from '@backstage/config';

declare const global: {
  fetch: jest.Mock;
}

describe('AdpDataTechRadarApi', () => {
  const mockData = {
    entries: [
      { id: '1', title: 'value 1', description: 'value', key: '1', url: '#value', quadrant: 'value', timeline: [{ date: new Date('2024-01-01'), moved: '0', ringId: 'value', 'description': '.'}] }
    ]
  };

  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ json: () => Promise.resolve(mockData)})
    );
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch data successfully', async () => {
    const config = new ConfigReader({
      techRadar: {
        data: 'value'
      }
    });

   const techradarapi = new AdpDataTechRadarApi(config);
   const data = await techradarapi.load(undefined);

   expect(global.fetch).toHaveBeenCalledWith('value');
   expect(data).toEqual(mockData)
  });
});