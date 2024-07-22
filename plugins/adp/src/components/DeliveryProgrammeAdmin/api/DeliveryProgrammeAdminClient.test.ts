import { faker } from '@faker-js/faker';
import type { DeliveryProgrammeAdmin } from '@internal/plugin-adp-common';
import { DeliveryProgrammeAdminClient } from './DeliveryProgrammeAdminClient';

jest.mock('@backstage/core-plugin-api', () => ({
  DiscoveryApi: jest.fn(),
  FetchApi: jest.fn(() => ({
    fetch: jest.fn(),
  })),
}));

function createDeliveryProgrammeAdmin(): DeliveryProgrammeAdmin {
  return {
    id: faker.string.uuid(),
    delivery_programme_id: faker.string.uuid(),
    aad_entity_ref_id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    updated_at: faker.date.past(),
  };
}

describe('DeliveryProgrammeAdminClient', () => {
  const discoveryApi = { getBaseUrl: jest.fn() };
  const fetchApi = { fetch: jest.fn() };
  const sut = new DeliveryProgrammeAdminClient(discoveryApi, fetchApi);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should get all Delivery Programme Admins', async () => {
      const expectedDeliveryProgrammeAdmins = faker.helpers.multiple(
        createDeliveryProgrammeAdmin,
        { count: 5 },
      );

      fetchApi.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(expectedDeliveryProgrammeAdmins),
      });

      const result = await sut.getAll();

      expect(result).toEqual(expectedDeliveryProgrammeAdmins);
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

  describe('getByDeliveryProgrammeId', () => {
    it('should get Delivery Programme Admins by Delivery Programme ID', async () => {
      const expectedDeliveryProgrammeAdmins = faker.helpers.multiple(
        createDeliveryProgrammeAdmin,
        { count: 2 },
      );

      fetchApi.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(expectedDeliveryProgrammeAdmins),
      });

      const result = await sut.getByDeliveryProgrammeId(
        expectedDeliveryProgrammeAdmins[0].delivery_programme_id,
      );

      expect(result).toEqual(expectedDeliveryProgrammeAdmins);
    });

    it('throws when Fetch fails', async () => {
      fetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'BadRequest',
        json: jest.fn().mockResolvedValue({ error: 'Not found' }),
      });

      await expect(sut.getByDeliveryProgrammeId('1234')).rejects.toThrow(
        /^Request failed with 400/,
      );
    });
  });

  describe('create', () => {
    it('should create new Delivery Programme Admins', async () => {
      const deliveryProgrammeId = faker.string.uuid();
      const userRef = faker.internet.userName();
      const groupEntityRef = faker.string.uuid();

      const expectedDeliveryProgrammeAdmin = {
        id: faker.string.uuid(),
        delivery_programme_id: deliveryProgrammeId,
        aad_entity_ref_id: faker.string.uuid(),
        email: faker.internet.email(),
        name: faker.person.fullName(),
        updated_at: faker.date.past(),
      };

      fetchApi.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(expectedDeliveryProgrammeAdmin),
      });

      const result = await sut.create(
        deliveryProgrammeId,
        userRef,
        groupEntityRef,
      );

      expect(result).toEqual(expectedDeliveryProgrammeAdmin);
    });

    it('throws when Fetch fails', async () => {
      const deliveryProgrammeId = faker.string.uuid();
      const userRef = faker.internet.userName();
      const groupEntityRef = faker.string.uuid();

      fetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'BadRequest',
        json: jest.fn().mockResolvedValue({ error: 'Not found' }),
      });

      await expect(
        sut.create(deliveryProgrammeId, userRef, groupEntityRef),
      ).rejects.toThrow('Validation failed');
    });
  });

  describe('delete', () => {
    it('should delete a delivery programme admin', async () => {
      const groupEntityRef = 'test-group';
      const deliveryProgrammeAdminId = faker.string.uuid();

      fetchApi.fetch.mockResolvedValue({
        ok: true,
      });

      await sut.delete(deliveryProgrammeAdminId, groupEntityRef);

      expect(fetchApi.fetch).toHaveBeenCalled();
    });

    it('throws when Fetch fails', async () => {
      const groupEntityRef = 'test-group';
      const deliveryProgrammeAdminId = faker.string.uuid();

      fetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'BadRequest',
        json: jest.fn().mockResolvedValue({ error: 'Not found' }),
      });

      await expect(
        sut.delete(deliveryProgrammeAdminId, groupEntityRef),
      ).rejects.toThrow(/^Request failed with 400/);
    });
  });
});
