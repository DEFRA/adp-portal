import type {
  CheckAdoProjectExistsResponse,
  CreateDeliveryProjectRequest,
  UpdateDeliveryProjectRequest,
} from '@internal/plugin-adp-common';
import { DeliveryProjectClient } from './DeliveryProjectClient';
import { randomUUID } from 'node:crypto';
import type { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';

describe('deliveryProjectClient', () => {
  let client: DeliveryProjectClient;
  let discoveryApi: jest.Mocked<DiscoveryApi>;
  let fetchApi: jest.Mocked<FetchApi>;

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
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '2',
          name: 'Project 1',
          title: 'Project 2',
          delivery_programme_id: '2',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const mockDeliveryProgrammes = [
        {
          id: '1',
          title: 'Programme 1',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '2',
          title: 'Programme 2',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      fetchApi.fetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mockDeliveryProjects), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mockDeliveryProgrammes), { status: 200 }),
        );

      const result = await client.getDeliveryProjects();
      const expected = [
        { ...mockDeliveryProjects[0], delivery_programme_name: 'Programme 1' },
        { ...mockDeliveryProjects[1], delivery_programme_name: 'Programme 2' },
      ];

      expect(result).toEqual(expected);
      expect(discoveryApi.getBaseUrl).toHaveBeenCalledWith('adp');
      expect(fetchApi.fetch).toHaveBeenNthCalledWith(
        1,
        'http://localhost/deliveryProjects',
      );
    });

    it('throws an error when the fetch fails', async () => {
      fetchApi.fetch.mockResolvedValue(
        new Response(JSON.stringify({ error: 'Not found' }), { status: 400 }),
      );

      await expect(client.getDeliveryProjects()).rejects.toThrow(
        'Failed to fetch Delivery Project',
      );
    });
  });

  describe('update delivery projects', () => {
    it('updates a delivery project successfully', async () => {
      const mockData = {
        name: 'Updated Body',
        created_at: new Date(),
        updated_at: new Date(),
      };

      fetchApi.fetch.mockResolvedValueOnce(
        new Response(JSON.stringify(mockData), { status: 200 }),
      );

      const updateData: UpdateDeliveryProjectRequest = {
        title: 'New Name',
        id: randomUUID(),
      };
      const result = await client.updateDeliveryProject(updateData);
      expect(result).toEqual(mockData);
      expect(fetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost/deliveryProjects',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        },
      );
    });

    it('throws an error when the update fails', async () => {
      const errorMessage = 'Failed to update';
      fetchApi.fetch.mockResolvedValue(
        new Response(JSON.stringify({ error: errorMessage }), { status: 400 }),
      );

      const updateData: UpdateDeliveryProjectRequest = {
        title: 'New Name',
        id: randomUUID(),
      };
      await expect(client.updateDeliveryProject(updateData)).rejects.toThrow(
        'Validation failed',
      );
      expect(fetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost/deliveryProjects',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        },
      );
    });

    it('updates a delivery project successfully if ado project is updated', async () => {
      const mockData = {
        name: 'Updated Body',
        created_at: new Date(),
        updated_at: new Date(),
      };
      const mockCheckAdoProjectExistsResponse: CheckAdoProjectExistsResponse = {
        exists: true,
      };

      fetchApi.fetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mockCheckAdoProjectExistsResponse), {
            status: 200,
          }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mockData), { status: 200 }),
        );

      const updateData: UpdateDeliveryProjectRequest = {
        title: 'New Name',
        ado_project: 'new ADO Project',
        id: randomUUID(),
      };
      const result = await client.updateDeliveryProject(updateData);
      expect(result).toEqual(mockData);
      expect(fetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost/deliveryProjects',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        },
      );
    });

    it('throws an error when new ADO project not exists on update', async () => {
      const mockData = {
        name: 'Updated Body',
        created_at: new Date(),
        updated_at: new Date(),
      };

      fetchApi.fetch
        .mockRejectedValueOnce('Project not found')
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mockData), { status: 200 }),
        );

      const updateData: UpdateDeliveryProjectRequest = {
        title: 'New Name',
        ado_project: 'new ADO Project',
        id: randomUUID(),
      };

      await expect(client.updateDeliveryProject(updateData)).rejects.toThrow(
        'Project does not exist in the DEFRA organization ADO, please enter a valid ADO project name',
      );
      expect(fetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost/deliveryProjects/adoProject/new ADO Project',
      );
    });
  });

  describe('create delivery project', () => {
    it('creates a delivery project successfully', async () => {
      const newData: CreateDeliveryProjectRequest = {
        title: 'New Body',
        ado_project: 'ADO Project',
        delivery_programme_id: randomUUID(),
        delivery_project_code: 'ABC',
        description: 'My test project',
        github_team_visibility: 'public',
        service_owner: 'test@email.com',
        team_type: 'delivery',
      };
      const mockCreateProjectResponse = {
        id: 1,
        name: 'New Body',
        namespace: 'adp-dmo',
        created_at: new Date(),
        updated_at: new Date(),
      };
      const mockCheckAdoProjectExistsResponse: CheckAdoProjectExistsResponse = {
        exists: true,
      };

      fetchApi.fetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mockCheckAdoProjectExistsResponse), {
            status: 200,
          }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mockCreateProjectResponse), {
            status: 200,
          }),
        )
        .mockResolvedValueOnce(new Response(undefined, { status: 200 }));

      const result = await client.createDeliveryProject(newData);
      expect(result).toEqual(mockCreateProjectResponse);
      expect(fetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost/deliveryProjects/adoProject/ADO Project',
      );
      expect(fetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost/deliveryProjects',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newData),
        },
      );
      expect(fetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost/deliveryProjects/ADP-DMO/createEntraIdGroups',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: '[]',
        },
      );
    });

    it('throws an error when ado project doesnt exists', async () => {
      const newData: CreateDeliveryProjectRequest = {
        title: 'New Body',
        ado_project: 'ADO Project',
        delivery_programme_id: randomUUID(),
        delivery_project_code: 'ABC',
        description: 'My test project',
        github_team_visibility: 'public',
        service_owner: 'test@email.com',
        team_type: 'delivery',
      };
      const mockCheckAdoProjectExistsResponse: CheckAdoProjectExistsResponse = {
        exists: false,
      };
      fetchApi.fetch.mockResolvedValueOnce(
        new Response(JSON.stringify(mockCheckAdoProjectExistsResponse), {
          status: 404,
        }),
      );
      await expect(client.createDeliveryProject(newData)).rejects.toThrow(
        'Project does not exist in the DEFRA organization ADO, please enter a valid ADO project name',
      );
      expect(fetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost/deliveryProjects/adoProject/ADO Project',
      );
    });

    it('throws an error when the ado project check fails', async () => {
      const newData: CreateDeliveryProjectRequest = {
        title: 'New Body',
        ado_project: 'ADO Project',
        delivery_programme_id: randomUUID(),
        delivery_project_code: 'ABC',
        description: 'My test project',
        github_team_visibility: 'public',
        service_owner: 'test@email.com',
        team_type: 'delivery',
      };
      const errorMessage =
        'Project does not exist in the DEFRA organization ADO, please enter a valid ADO project name';
      fetchApi.fetch.mockRejectedValue('Unknown error');
      await expect(client.createDeliveryProject(newData)).rejects.toThrow(
        errorMessage,
      );
      expect(fetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost/deliveryProjects/adoProject/ADO Project',
      );
    });

    it('throws an error when createEntraIdGroupsForProject fetchapi returns not ok', async () => {
      const newData: CreateDeliveryProjectRequest = {
        title: 'New Body',
        ado_project: 'ADO Project',
        delivery_programme_id: randomUUID(),
        delivery_project_code: 'ABC',
        description: 'My test project',
        github_team_visibility: 'public',
        service_owner: 'test@email.com',
        team_type: 'delivery',
      };
      const mockCreateProjectResponse = {
        id: 1,
        name: 'new-body',
        title: 'New Body',
        namespace: 'adp-dmo',
      };

      const mockCheckAdoProjectExistsResponse: CheckAdoProjectExistsResponse = {
        exists: true,
      };

      fetchApi.fetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mockCheckAdoProjectExistsResponse), {
            status: 200,
          }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mockCreateProjectResponse), {
            status: 200,
          }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ error: 'Error' }), { status: 404 }),
        );

      await expect(client.createDeliveryProject(newData)).rejects.toThrow(
        /Failed to create Entra ID groups for project/,
      );
      expect(fetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost/deliveryProjects/adoProject/ADO Project',
      );
      expect(fetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost/deliveryProjects',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newData),
        },
      );
      expect(fetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost/deliveryProjects/ADP-DMO/createEntraIdGroups',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: '[]',
        },
      );
    });

    it('throws an error when createEntraIdGroupsForProject fetchapi throws error', async () => {
      const newData: CreateDeliveryProjectRequest = {
        title: 'New Body',
        ado_project: 'ADO Project',
        delivery_programme_id: randomUUID(),
        delivery_project_code: 'ABC',
        description: 'My test project',
        github_team_visibility: 'public',
        service_owner: 'test@email.com',
        team_type: 'delivery',
      };
      const mockCreateProjectResponse = {
        id: 1,
        name: 'New Body',
        namespace: 'adp-dmo',
        created_at: new Date(),
        updated_at: new Date(),
      };
      const mockCheckAdoProjectExistsResponse: CheckAdoProjectExistsResponse = {
        exists: true,
      };

      fetchApi.fetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mockCheckAdoProjectExistsResponse), {
            status: 200,
          }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mockCreateProjectResponse), {
            status: 200,
          }),
        )
        .mockRejectedValueOnce('Unknown error');
      fetchApi.fetch.mockRejectedValue('Unknown error');
      await expect(client.createDeliveryProject(newData)).rejects.toThrow(
        /Failed to create Entra ID groups for project/,
      );
      expect(fetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost/deliveryProjects/ADP-DMO/createEntraIdGroups',
        {
          body: '[]',
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        },
      );
    });
  });

  describe('getDeliveryProjectById', () => {
    it('fetches a delivery project by ID successfully', async () => {
      const mockProject = {
        id: '1',
        name: 'Test Project',
        created_at: new Date(),
        updated_at: new Date(),
      };
      fetchApi.fetch.mockResolvedValue(
        new Response(JSON.stringify(mockProject), { status: 200 }),
      );

      const result = await client.getDeliveryProjectById('1');
      expect(result).toEqual(mockProject);
      expect(discoveryApi.getBaseUrl).toHaveBeenCalledWith('adp');

      expect(fetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost/deliveryProjects/1',
      );
    });

    it('throws an error when fetching a delivery project by ID fails', async () => {
      fetchApi.fetch.mockResolvedValue(
        new Response(JSON.stringify({ error: 'Project not found' }), {
          status: 404,
        }),
      );

      await expect(
        client.getDeliveryProjectById('nonexistent-id'),
      ).rejects.toThrow('Failed to fetch Delivery Project by ID');
    });
  });
});
