import type {
  CreateDeliveryProgrammeRequest,
  UpdateDeliveryProgrammeRequest,
} from '@internal/plugin-adp-common';
import { DeliveryProgrammeClient } from './DeliveryProgrammeClient';
import { randomUUID } from 'node:crypto';

describe('deliveryProgrammeClient', () => {
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
        {
          ...mockDeliveryProgrammes[0],
          arms_length_body_id_name: 'ALB Name 1',
        },
        {
          ...mockDeliveryProgrammes[1],
          arms_length_body_id_name: 'ALB Name 2',
        },
      ];

      expect(result).toEqual(expected);
      expect(discoveryApi.getBaseUrl).toHaveBeenCalledWith('adp');
      expect(fetchApi.fetch).toHaveBeenNthCalledWith(
        1,
        'http://localhost/deliveryProgramme',
      );
      expect(fetchApi.fetch).toHaveBeenNthCalledWith(
        2,
        'http://localhost/armslengthbodynames',
      );
    });

    it('throws an error when the fetch fails', async () => {
      const errorMessage = 'Failed to get delivery programmes';
      fetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: jest.fn().mockResolvedValue({ error: errorMessage }),
      });

      await expect(client.getDeliveryProgrammes()).rejects.toThrow(
        /^Request failed with 400/,
      );
    });
  });

  describe('update delivery programmes', () => {
    it('updates a delivery programme successfully', async () => {
      const mockData = [{ name: 'Updated Body' }];
      fetchApi.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockData),
      });

      const updateData: UpdateDeliveryProgrammeRequest = {
        id: randomUUID(),
        title: 'My programme',
      };
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

      const updateData: UpdateDeliveryProgrammeRequest = {
        id: randomUUID(),
        title: 'My programme',
      };
      await expect(client.updateDeliveryProgramme(updateData)).rejects.toThrow(
        'Validation failed',
      );
    });
  });

  describe('create delivery programme', () => {
    it('creates a delivery programme successfully', async () => {
      const newData: CreateDeliveryProgrammeRequest = {
        arms_length_body_id: randomUUID(),
        delivery_programme_code: 'ABC',
        description: 'Test programme',
        title: 'My Programme',
      };
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
      const newData: CreateDeliveryProgrammeRequest = {
        arms_length_body_id: randomUUID(),
        delivery_programme_code: 'ABC',
        description: 'Test programme',
        title: 'My Programme',
      };
      const errorMessage = 'Failed to create Delivery Programme';
      fetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: jest.fn().mockResolvedValue({ error: errorMessage }),
      });

      await expect(client.createDeliveryProgramme(newData)).rejects.toThrow(
        'Validation failed',
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

      expect(fetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost/deliveryProgramme/1',
      );
    });

    it('throws an error when fetching a delivery programme by ID fails', async () => {
      fetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: jest.fn().mockResolvedValue({ error: 'Programme not found' }),
      });

      await expect(
        client.getDeliveryProgrammeById('nonexistent-id'),
      ).rejects.toThrow(/^Request failed with 404/);
    });
  });

  describe('getDeliveryProgrammeAdmins', () => {
    it('fetches Delivery Programme Admins successfully', async () => {
      const mockProgrammeAdmins = [
        { id: '1', name: '<NAME>' },
        { id: '2', name: '<NAME>' },
      ];
      fetchApi.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockProgrammeAdmins),
      });
      const result = await client.getDeliveryProgrammeAdmins();
      expect(result).toEqual(mockProgrammeAdmins);
    });
    it('throws error when fetch errors out', async () => {
      fetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: jest.fn().mockResolvedValue({ error: 'unknown error' }),
      });
      await expect(client.getDeliveryProgrammeAdmins()).rejects.toThrow(
        /^Request failed with 404/,
      );
    });
  });
});
