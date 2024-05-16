import { faker } from '@faker-js/faker';
import type {
  DeliveryProjectUser,
  UpdateDeliveryProjectUserRequest,
} from '@internal/plugin-adp-common';
import { DeliveryProjectUserClient } from './DeliveryProjectUserClient';

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
  const discoveryApi = { getBaseUrl: jest.fn() };
  const fetchApi = { fetch: jest.fn() };
  const sut = new DeliveryProjectUserClient(discoveryApi, fetchApi);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should get all Delivery Project Users', async () => {
      const expectedDeliveryProjectUsers = faker.helpers.multiple(
        createDeliveryProjectUser,
        { count: 5 },
      );

      fetchApi.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(expectedDeliveryProjectUsers),
      });

      const result = await sut.getAll();

      expect(result).toEqual(expectedDeliveryProjectUsers);
    });

    it('throws when Fetch fails', async () => {
      fetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'BadRequest',
        json: jest.fn().mockResolvedValue({ error: 'Not found' }),
      });

      await expect(sut.getAll()).rejects.toThrow(/^Request failed with 400/);
    });
  });

  describe('getByDeliveryProjectId', () => {
    it('should get Delivery Project Users by Delivery Project ID', async () => {
      const expectedDeliveryProjectUsers = faker.helpers.multiple(
        createDeliveryProjectUser,
        { count: 2 },
      );

      fetchApi.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(expectedDeliveryProjectUsers),
      });

      const result = await sut.getByDeliveryProjectId(
        expectedDeliveryProjectUsers[0].delivery_project_id,
      );

      expect(result).toEqual(expectedDeliveryProjectUsers);
    });

    it('throws when Fetch fails', async () => {
      fetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'BadRequest',
        json: jest.fn().mockResolvedValue({ error: 'Not found' }),
      });

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

      fetchApi.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(expectedDeliveryProjectUser),
      });

      const result = await sut.create({
        delivery_project_id: deliveryProjectId,
        is_technical: faker.datatype.boolean(),
        is_admin: faker.datatype.boolean(),
        github_username: userRef,
        user_catalog_name: userRef,
      });

      expect(result).toEqual(expectedDeliveryProjectUser);
    });

    it('catches and throws 400 error', async () => {
      const deliveryProjectId = faker.string.uuid();
      const userRef = faker.internet.userName();

      fetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'BadRequest',
        json: jest.fn().mockResolvedValue({ error: 'Not found' }),
      });

      await expect(
        sut.create({
          delivery_project_id: deliveryProjectId,
          is_technical: faker.datatype.boolean(),
          is_admin: faker.datatype.boolean(),
          github_username: userRef,
          user_catalog_name: userRef,
        }),
      ).rejects.toThrow('Validation failed');
    });

    it('catches and throws other uncaught errors', async () => {
      const deliveryProjectId = faker.string.uuid();
      const userRef = faker.internet.userName();

      fetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'ServerErrpr',
        json: jest.fn().mockResolvedValue({ error: 'Not found' }),
      });

      await expect(
        sut.create({
          delivery_project_id: deliveryProjectId,
          is_technical: faker.datatype.boolean(),
          is_admin: faker.datatype.boolean(),
          github_username: userRef,
          user_catalog_name: userRef,
        }),
      ).rejects.toThrow(/Request failed with 500/);
    });
  });

  describe('update', () => {
    it('updates a Delivery Project User successfully', async () => {
      const mockData = [{ id: '1234', is_admin: true }];
      fetchApi.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockData),
      });

      const updateData: UpdateDeliveryProjectUserRequest = {
        is_admin: true,
        id: faker.string.uuid(),
      };
      const result = await sut.update(updateData);
      expect(result).toEqual(mockData);
    });

    it('catches and throws 400 error', async () => {
      fetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'BadRequest',
        json: jest.fn().mockResolvedValue({ error: 'Not found' }),
      });

      await expect(
        sut.update({
          is_admin: true,
          id: faker.string.uuid(),
        }),
      ).rejects.toThrow('Validation failed');
    });

    it('catches and throws other uncaught errors', async () => {
      fetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'ServerError',
        json: jest.fn().mockResolvedValue({ error: 'Not found' }),
      });

      await expect(
        sut.update({
          is_admin: true,
          id: faker.string.uuid(),
        }),
      ).rejects.toThrow(/Request failed with 500/);
    });
  });
});
