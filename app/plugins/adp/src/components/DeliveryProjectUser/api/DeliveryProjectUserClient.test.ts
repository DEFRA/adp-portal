import { faker } from '@faker-js/faker';
import type {
  DeliveryProjectUser,
  UpdateDeliveryProjectUserRequest,
} from '@internal/plugin-adp-common';
import { DeliveryProjectUserClient } from './DeliveryProjectUserClient';
import type { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';

jest.mock('@backstage/core-plugin-api', () => ({
  DiscoveryApi: jest.fn(),
  FetchApi: jest.fn(() => ({
    fetch: jest.fn(),
  })),
}));

function createDeliveryProjectUser(): DeliveryProjectUser {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return {
    id: faker.string.uuid(),
    delivery_project_id: faker.string.uuid(),
    aad_entity_ref_id: faker.string.uuid(),
    email: faker.internet.email({ firstName, lastName }),
    name: faker.person.fullName({ firstName, lastName }),
    updated_at: faker.date.past(),
    is_admin: faker.datatype.boolean(),
    is_technical: faker.datatype.boolean(),
    github_username: faker.internet.userName({ firstName, lastName }),
  };
}

describe('DeliveryProjectUserClient', () => {
  const discoveryApi: jest.Mocked<DiscoveryApi> = { getBaseUrl: jest.fn() };
  const fetchApi: jest.Mocked<FetchApi> = { fetch: jest.fn() };
  const sut = new DeliveryProjectUserClient(discoveryApi, fetchApi);

  beforeEach(() => {
    jest.clearAllMocks();
    discoveryApi.getBaseUrl.mockResolvedValue('http://localhost:123');
  });

  describe('getAll', () => {
    it('should get all Delivery Project Users', async () => {
      const expectedDeliveryProjectUsers = faker.helpers.multiple(
        createDeliveryProjectUser,
        { count: 5 },
      );

      fetchApi.fetch.mockResolvedValue(
        new Response(JSON.stringify(expectedDeliveryProjectUsers), {
          status: 200,
        }),
      );

      const result = await sut.getAll();

      expect(result).toEqual(expectedDeliveryProjectUsers);
    });

    it('throws when Fetch fails', async () => {
      fetchApi.fetch.mockResolvedValue(
        new Response(JSON.stringify({ error: 'Not found' }), { status: 400 }),
      );

      await expect(sut.getAll()).rejects.toThrow(/^Request failed with 400/);
    });
  });

  describe('getByDeliveryProjectId', () => {
    it('should get Delivery Project Users by Delivery Project ID', async () => {
      const expectedDeliveryProjectUsers = faker.helpers.multiple(
        createDeliveryProjectUser,
        { count: 2 },
      );

      fetchApi.fetch.mockResolvedValue(
        new Response(JSON.stringify(expectedDeliveryProjectUsers), {
          status: 200,
        }),
      );

      const result = await sut.getByDeliveryProjectId(
        expectedDeliveryProjectUsers[0].delivery_project_id,
      );

      expect(result).toEqual(expectedDeliveryProjectUsers);
    });

    it('throws when Fetch fails', async () => {
      fetchApi.fetch.mockResolvedValue(
        new Response(JSON.stringify({ error: 'Not found' }), { status: 400 }),
      );

      await expect(sut.getByDeliveryProjectId('1234')).rejects.toThrow(
        /^Request failed with 400/,
      );
    });
  });

  describe('create', () => {
    it('should create a new Delivery Project User', async () => {
      const deliveryProjectId = faker.string.uuid();
      const userRef = faker.internet.userName();

      const expectedDeliveryProjectUser: DeliveryProjectUser = {
        id: faker.string.uuid(),
        delivery_project_id: deliveryProjectId,
        aad_entity_ref_id: faker.string.uuid(),
        email: faker.internet.email(),
        name: faker.person.fullName(),
        updated_at: faker.date.past(),
        is_technical: faker.datatype.boolean(),
        is_admin: faker.datatype.boolean(),
        github_username: userRef,
      };
      const data = {
        delivery_project_id: deliveryProjectId,
        is_technical: faker.datatype.boolean(),
        is_admin: faker.datatype.boolean(),
        github_username: userRef,
        user_catalog_name: userRef,
      };

      fetchApi.fetch.mockResolvedValue(
        new Response(JSON.stringify(expectedDeliveryProjectUser), {
          status: 200,
        }),
      );

      const result = await sut.create(data);

      expect(result).toEqual(expectedDeliveryProjectUser);
      expect(fetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:123/deliveryProjectUsers',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        },
      );
    });

    it('catches and throws 400 error', async () => {
      const deliveryProjectId = faker.string.uuid();
      const userRef = faker.internet.userName();
      const data = {
        delivery_project_id: deliveryProjectId,
        is_technical: faker.datatype.boolean(),
        is_admin: faker.datatype.boolean(),
        github_username: userRef,
        user_catalog_name: userRef,
      };

      fetchApi.fetch.mockResolvedValue(
        new Response(JSON.stringify({ error: 'Not found' }), { status: 400 }),
      );

      await expect(sut.create(data)).rejects.toThrow('Validation failed');
      expect(fetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:123/deliveryProjectUsers',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        },
      );
    });

    it('catches and throws other uncaught errors', async () => {
      const deliveryProjectId = faker.string.uuid();
      const userRef = faker.internet.userName();
      const data = {
        delivery_project_id: deliveryProjectId,
        is_technical: faker.datatype.boolean(),
        is_admin: faker.datatype.boolean(),
        github_username: userRef,
        user_catalog_name: userRef,
      };

      fetchApi.fetch.mockResolvedValue(
        new Response(JSON.stringify({ error: 'Not found' }), { status: 500 }),
      );

      await expect(sut.create(data)).rejects.toThrow(/Request failed with 500/);
      expect(fetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:123/deliveryProjectUsers',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        },
      );
    });
  });

  describe('update', () => {
    it('updates a Delivery Project User successfully', async () => {
      const mockData = {
        id: '1234',
        is_admin: true,
        updated_at: new Date(),
      };
      fetchApi.fetch.mockResolvedValue(
        new Response(JSON.stringify(mockData), { status: 200 }),
      );

      const updateData: UpdateDeliveryProjectUserRequest = {
        is_admin: true,
        id: faker.string.uuid(),
        delivery_project_id: faker.string.uuid(),
      };
      const result = await sut.update(updateData);
      expect(result).toEqual(mockData);
      expect(fetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:123/deliveryProjectUsers',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        },
      );
    });

    it('catches and throws 400 error', async () => {
      const updateData = {
        is_admin: true,
        id: faker.string.uuid(),
        delivery_project_id: faker.string.uuid(),
        user_catalog_name: faker.internet.email(),
      };

      fetchApi.fetch.mockResolvedValue(
        new Response(JSON.stringify({ error: 'Not found' }), { status: 400 }),
      );

      await expect(sut.update(updateData)).rejects.toThrow('Validation failed');
      expect(fetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:123/deliveryProjectUsers',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        },
      );
    });

    it('catches and throws other uncaught errors', async () => {
      const updateData = {
        is_admin: true,
        id: faker.string.uuid(),
        delivery_project_id: faker.string.uuid(),
        user_catalog_name: faker.internet.email(),
      };

      fetchApi.fetch.mockResolvedValue(
        new Response(JSON.stringify({ error: 'Not found' }), { status: 500 }),
      );

      await expect(sut.update(updateData)).rejects.toThrow(
        /Request failed with 500/,
      );
      expect(fetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:123/deliveryProjectUsers',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        },
      );
    });
  });

  describe('delete', () => {
    it('should delete a delivery project user', async () => {
      const deliveryProjectUserId = faker.string.uuid();
      const deliveryProjectId = faker.string.uuid();

      fetchApi.fetch.mockResolvedValue(
        new Response(
          JSON.stringify({
            ok: true,
          }),
          { status: 204 },
        ),
      );

      await sut.delete(deliveryProjectUserId, deliveryProjectId);

      expect(fetchApi.fetch).toHaveBeenCalled();
    });

    it('throws when Fetch fails', async () => {
      const deliveryProjectUserId = faker.string.uuid();
      const deliveryProjectId = faker.string.uuid();

      fetchApi.fetch.mockResolvedValue(
        new Response(JSON.stringify({ error: 'Bad request' }), { status: 400 }),
      );

      await expect(
        sut.delete(deliveryProjectUserId, deliveryProjectId),
      ).rejects.toThrow(/^Request failed with 400/);
    });
  });
});
