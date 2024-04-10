import { DeliveryProgrammeClient } from './DeliveryProgrammeClient';

jest.mock('@backstage/core-plugin-api', () => ({
  DiscoveryApi: jest.fn(),
  FetchApi: jest.fn(() => ({
    fetch: jest.fn(),
  })),
}));

describe('armsLengthBodyClient', () => {
  let client: DeliveryProgrammeClient;
  let discoveryApi: { getBaseUrl: any };
  let fetchApi: { fetch: any };

  beforeEach(() => {
    discoveryApi = { getBaseUrl: jest.fn() };
    fetchApi = { fetch: jest.fn() };

    discoveryApi.getBaseUrl.mockResolvedValue('http://localhost');

    client = new DeliveryProgrammeClient(discoveryApi, fetchApi);
  });

  describe('get delivery programmes', () => {
    it('fetches delivery programmes successfully and provides ALB names', async () => {
      const mockDeliveryProgrammes = [
        { id: '1', name: 'Programme 1', arms_length_body_id: 'alb1' },
        { id: '2', name: 'Programme 2', arms_length_body_id: 'alb2' },
      ];
      const mockAlbNamesMapping = {
        alb1: 'ALB Name 1',
        alb2: 'ALB Name 2',
      };
  
      fetchApi.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockDeliveryProgrammes),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockAlbNamesMapping),
        });
  
      const result = await client.getDeliveryProgrammes();
  
      const expected = [
        { ...mockDeliveryProgrammes[0], arms_length_body_id_name: 'ALB Name 1' },
        { ...mockDeliveryProgrammes[1], arms_length_body_id_name: 'ALB Name 2' },
      ];
  
      expect(result).toEqual(expected);
      expect(discoveryApi.getBaseUrl).toHaveBeenCalledWith('adp');
      expect(fetchApi.fetch).toHaveBeenNthCalledWith(1, 'http://localhost/deliveryProgramme');
      expect(fetchApi.fetch).toHaveBeenNthCalledWith(2, 'http://localhost/armslengthbodynames');
    });

    it('throws an error when the fetch fails', async () => {
      fetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'BadRequest',
        json: jest.fn().mockResolvedValue({ error: 'Not found' }),
      });

      await expect(client.getDeliveryProgrammes()).rejects.toThrow();
    });
  });

  describe('update delivery programmes', () => {
    it('updates a delivery programme successfully', async () => {
      const mockData = [{ name: 'Updated Body' }];
      fetchApi.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockData),
      });

      const updateData = { name: 'New Name' };
      const result = await client.updateDeliveryProgramme(updateData);
      expect(result).toEqual(mockData);
    });

    it('throws an error when the update fails', async () => {
      const errorMessage = 'Failed to update';
      fetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: jest.fn().mockResolvedValue({ error: errorMessage }),
      });

      const updateData = { name: 'New Name' };
      await expect(client.updateDeliveryProgramme(updateData)).rejects.toThrow(
        'Request failed with 400 Error',
      );
    });
  });

  describe('create delivery programme', () => {
    it('creates a delivery programme successfully', async () => {
      const newData = { name: 'New Body' };
      const mockResponseData = [{ id: 1, name: 'New Body' }];

      fetchApi.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponseData),
      });

      const result = await client.createDeliveryProgramme(newData);
      expect(result).toEqual(mockResponseData);

      expect(fetchApi.fetch).toHaveBeenCalledWith(expect.any(String), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newData),
      });
    });

    it('throws an error when the creation fails', async () => {
      const newData = { name: 'New Body' };
      const errorMessage = 'Failed to create Delivery Programme';
      fetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: jest.fn().mockResolvedValue({ error: errorMessage }),
      });

      await expect(client.createDeliveryProgramme(newData)).rejects.toThrow(
        'Request failed with 400 Error',
      );
    });
  });
  describe('getDeliveryProgrammeById', () => {
    it('fetches a delivery programme by ID successfully', async () => {

      const mockProgramme = { id: '1', name: 'Test Programme' };
      fetchApi.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockProgramme),
      });
  
   
      const result = await client.getDeliveryProgrammeById('1');
      expect(result).toEqual(mockProgramme);
      expect(discoveryApi.getBaseUrl).toHaveBeenCalledWith('adp');
     
      expect(fetchApi.fetch).toHaveBeenCalledWith('http://localhost/deliveryProgramme/1');
    });
  
    it('throws an error when fetching a delivery programme by ID fails', async () => {
  
      fetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: jest.fn().mockResolvedValue({ error: 'Programme not found' }),
      });
  

      await expect(client.getDeliveryProgrammeById('nonexistent-id')).rejects.toThrow('Failed to fetch Delivery Programme by ID');
    });
  });
  
 
});
