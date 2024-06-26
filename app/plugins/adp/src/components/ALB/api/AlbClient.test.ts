import type {
  CreateArmsLengthBodyRequest,
  UpdateArmsLengthBodyRequest,
} from '@internal/plugin-adp-common';
import { ArmsLengthBodyClient } from './AlbClient';
import { randomUUID } from 'node:crypto';

describe('armsLengthBodyClient', () => {
  let client: ArmsLengthBodyClient;
  let discoveryApi: { getBaseUrl: any };
  let fetchApi: { fetch: any };

  beforeEach(() => {
    discoveryApi = { getBaseUrl: jest.fn() };
    fetchApi = { fetch: jest.fn() };

    discoveryApi.getBaseUrl.mockResolvedValue('http://localhost');

    client = new ArmsLengthBodyClient(discoveryApi, fetchApi);
  });

  describe('getArmsLengthBodies', () => {
    it('fetches arms length bodies successfully', async () => {
      const mockData = [{ name: 'Test Body' }];
      fetchApi.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockData),
      });

      const result = await client.getArmsLengthBodies();
      expect(result).toEqual(mockData);
      expect(discoveryApi.getBaseUrl).toHaveBeenCalledWith('adp');
      expect(fetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost/armsLengthBodies',
      );
    });

    it('throws an error when the fetch fails', async () => {
      fetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'BadRequest',
        json: jest.fn().mockResolvedValue({ error: 'Not found' }),
      });

      await expect(client.getArmsLengthBodies()).rejects.toThrow();
    });
  });

  describe('updateArmsLengthBody', () => {
    it('updates an arms length body successfully', async () => {
      const mockData = [{ name: 'Updated Body' }];
      fetchApi.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockData),
      });

      const updateData: UpdateArmsLengthBodyRequest = {
        id: randomUUID(),
        title: 'My Arms Length Body',
      };
      const result = await client.updateArmsLengthBody(updateData);
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

      const updateData: UpdateArmsLengthBodyRequest = {
        id: randomUUID(),
        title: 'My Arms Length Body',
      };
      await expect(client.updateArmsLengthBody(updateData)).rejects.toThrow(
        'Validation failed',
      );
    });
  });

  describe('createArmsLengthBody', () => {
    it('creates an arms length body successfully', async () => {
      const newData: CreateArmsLengthBodyRequest = {
        description: 'Test arms length body',
        title: 'New Body',
      };
      const mockResponseData = [{ id: 1, name: 'New Body' }];

      fetchApi.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponseData),
      });

      const result = await client.createArmsLengthBody(newData);
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
      const newData: CreateArmsLengthBodyRequest = {
        description: 'Test arms length body',
        title: 'New Body',
      };
      const errorMessage = 'Failed to create Arms Length Body';
      fetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: jest.fn().mockResolvedValue({ error: errorMessage }),
      });

      await expect(client.createArmsLengthBody(newData)).rejects.toThrow(
        'Validation failed',
      );
    });
  });

  describe('getArmsLengthBodyNames', () => {
    it('fetches arms length body names successfully', async () => {
      const mockNamesMapping = { '1': 'Body Name 1', '2': 'Body Name 2' };
      fetchApi.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockNamesMapping),
      });

      const namesMapping = await client.getArmsLengthBodyNames();

      expect(namesMapping).toEqual(mockNamesMapping);
      expect(discoveryApi.getBaseUrl).toHaveBeenCalledWith('adp');
      expect(fetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost/armslengthbodies/names',
      );
    });

    it('throws an error when fetching arms length body names fails', async () => {
      fetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: jest.fn().mockResolvedValue({ error: 'Endpoint not found' }),
      });

      await expect(client.getArmsLengthBodyNames()).rejects.toThrow(
        'Failed to fetch arms length bodies',
      );
    });
  });
});
