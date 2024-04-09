import { DeliveryProgrammeClient } from '../../DeliveryProgramme/api';
import { DeliveryProjectClient } from './DeliveryProjectClient';

jest.mock('@backstage/core-plugin-api', () => ({
  DiscoveryApi: jest.fn(),
  FetchApi: jest.fn(() => ({
    fetch: jest.fn(),
  })),
}));

describe('deliveryProjectClient', () => {
  let client: DeliveryProjectClient;
  let discoveryApi: { getBaseUrl: any };
  let fetchApi: { fetch: any };

  beforeEach(() => {
    discoveryApi = { getBaseUrl: jest.fn() };
    fetchApi = { fetch: jest.fn() };

    discoveryApi.getBaseUrl.mockResolvedValue('http://localhost');

    client = new DeliveryProjectClient(discoveryApi, fetchApi);
  });

  describe('get delivery projects', () => {
    it('fetches delivery projects successfully', async () => {
      const mockDeliveryProjects = [
        {
          id: '1',
          name: 'Project 1',
          title: 'Project 1',
          delivery_programme_id: '1',
        },
        {
          id: '2',
          name: 'Project 1',
          title: 'Project 2',
          delivery_programme_id: '2',
        },
      ];

      const mockDeliveryProgrammes = [
        { id: '1', title: 'Programme 1' },
        { id: '2', title: 'Programme 2' },
      ];

      fetchApi.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockDeliveryProjects),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockDeliveryProgrammes),
        });

      const result = await client.getDeliveryProjects();
      const expected = [
        { ...mockDeliveryProjects[0], delivery_programme_name: 'Programme 1' },
        { ...mockDeliveryProjects[1], delivery_programme_name: 'Programme 2' },
      ];

      expect(result).toEqual(expected);
      expect(discoveryApi.getBaseUrl).toHaveBeenCalledWith('adp');
      expect(fetchApi.fetch).toHaveBeenNthCalledWith(
        1,
        'http://localhost/deliveryProject',
      );
    });

    it('throws an error when the fetch fails', async () => {
      fetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'BadRequest',
        json: jest.fn().mockResolvedValue({ error: 'Not found' }),
      });

      await expect(client.getDeliveryProjects()).rejects.toThrow();
    });
  });

  describe('update delivery projects', () => {
    it('updates a delivery project successfully', async () => {
      const mockData = [{ name: 'Updated Body' }];
      fetchApi.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockData),
      });

      const updateData = { name: 'New Name' };
      const result = await client.updateDeliveryProject(updateData);
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
      await expect(client.updateDeliveryProject(updateData)).rejects.toThrow();
    });
  });

  describe('create delivery project', () => {
    it('creates a delivery project successfully', async () => {
      const newData = { name: 'New Body', delivery_programme_id: '1' };
      const mockCreateProjectResponse = {
        id: 1,
        name: 'New Body',
        namespace: 'adp-dmo',
      };
      jest
        .spyOn(DeliveryProgrammeClient.prototype, 'getDeliveryProgrammeById')
        .mockImplementation(() =>
          Promise.resolve({
            id: '1',
            name: 'Programme 1',
            arms_length_body_id: 'alb1',
            programme_managers: [
              {
                email: 'x@y.com',
                aad_entity_ref_id: 'id',
                delivery_programme_id: '1',
                id: 'm1',
                name: 'manager',
              },
            ],
            created_at: new Date(),
            updated_at: new Date(),
            updated_by: 'author',
            delivery_programme_code: 'prog1',
            description: 'Description',
            title: 'Title',
            finance_code: 'fincode',
          }),
        );

      fetchApi.fetch
        .mockResolvedValueOnce({
          ok: true,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockCreateProjectResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
        });

      const result = await client.createDeliveryProject(newData);
      expect(result).toEqual(mockCreateProjectResponse);
      expect(fetchApi.fetch).toHaveBeenCalledWith(expect.any(String), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newData),
      });
    });

    it('throws an error when ado project doesnt exists', async () => {
      const newData = { name: 'New Body' };
      fetchApi.fetch.mockResolvedValueOnce({
        ok: false,
      });
      await expect(client.createDeliveryProject(newData)).rejects.toThrow(
        'Failed to create Delivery Project',
      );
    });

    it('throws an error when the ado project check fails', async () => {
      const newData = { name: 'New Body' };
      const errorMessage = 'Failed to create Delivery Project';
      fetchApi.fetch.mockRejectedValue('Unknown error');
      await expect(client.createDeliveryProject(newData)).rejects.toThrow(
        errorMessage,
      );
    });

    it('throws an error when createEntraIdGroupsForProject fetchapi returns not ok', async () => {
      const newData = { name: 'New Body', delivery_programme_id: '1' };
      const mockCreateProjectResponse = {
        id: 1,
        name: 'New Body',
        namespace: 'adp-dmo',
      };
      jest
        .spyOn(DeliveryProgrammeClient.prototype, 'getDeliveryProgrammeById')
        .mockImplementation(() =>
          Promise.resolve({
            id: '1',
            name: 'Programme 1',
            arms_length_body_id: 'alb1',
            programme_managers: [
              {
                email: 'x@y.com',
                aad_entity_ref_id: 'id',
                delivery_programme_id: '1',
                id: 'm1',
                name: 'manager',
              },
            ],
            created_at: new Date(),
            updated_at: new Date(),
            updated_by: 'author',
            delivery_programme_code: 'prog1',
            description: 'Description',
            title: 'Title',
            finance_code: 'fincode',
          }),
        );

      fetchApi.fetch
        .mockResolvedValueOnce({
          ok: true,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockCreateProjectResponse),
        })
        .mockResolvedValueOnce({
          ok: false,
        });

      await expect(client.createDeliveryProject(newData)).rejects.toThrow(
        'Failed to create Delivery Project',
      );
    });

    it('throws an error when createEntraIdGroupsForProject fetchapi throws error', async () => {
      const newData = { name: 'New Body' };
      const errorMessage = 'Failed to create Delivery Project';
      fetchApi.fetch.mockRejectedValue('Unknown error');
      await expect(client.createDeliveryProject(newData)).rejects.toThrow(
        errorMessage,
      );
    });
  });
  describe('getDeliveryProjectById', () => {
    it('fetches a delivery project by ID successfully', async () => {
      const mockProject = { id: '1', name: 'Test Project' };
      fetchApi.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockProject),
      });

      const result = await client.getDeliveryProjectById('1');
      expect(result).toEqual(mockProject);
      expect(discoveryApi.getBaseUrl).toHaveBeenCalledWith('adp');

      expect(fetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost/deliveryProject/1',
      );
    });

    it('throws an error when fetching a delivery project by ID fails', async () => {
      fetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: jest.fn().mockResolvedValue({ error: 'Project not found' }),
      });

      await expect(
        client.getDeliveryProjectById('nonexistent-id'),
      ).rejects.toThrow('Failed to fetch Delivery Project by ID');
    });
  });
});
