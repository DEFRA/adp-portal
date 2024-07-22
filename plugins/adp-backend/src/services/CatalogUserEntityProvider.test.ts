import { CatalogClient } from '@backstage/catalog-client';
import { CatalogUserEntityProvider } from './CatalogUserEntityProvider';
import { mockServices } from '@backstage/backend-test-utils';
import { randomUUID } from 'node:crypto';
import type { UserEntity } from '@backstage/catalog-model';

describe('CatalogUserEntityProvider', () => {
  describe('#getByEntityRef', () => {
    it('Return undefined if the entity is not found', async () => {
      const { sut, catalog } = setup();
      const ref = randomUUID();
      catalog.getEntityByRef.mockResolvedValue(undefined);

      const actual = await sut.getByEntityRef(ref);

      expect(actual).toBeUndefined();
      expect(catalog.getEntityByRef).toHaveBeenCalledWith(ref, {
        token: 'mock-service-token:{"sub":"plugin:test","target":"catalog"}',
      });
    });
    it('Return undefined if the entity is not a user', async () => {
      const { sut, catalog } = setup();
      const ref = randomUUID();
      catalog.getEntityByRef.mockResolvedValue({
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'NotAUser',
        metadata: {
          name: 'abc',
        },
      });

      const actual = await sut.getByEntityRef(ref);

      expect(actual).toBeUndefined();
      expect(catalog.getEntityByRef).toHaveBeenCalledWith(ref, {
        token: 'mock-service-token:{"sub":"plugin:test","target":"catalog"}',
      });
    });
    it('Return the entity if the entity is not a user', async () => {
      const { sut, catalog } = setup();
      const ref = randomUUID();
      const expected: UserEntity = {
        apiVersion: 'backstage.io/v1beta1',
        kind: 'User',
        metadata: {
          name: 'abc',
        },
        spec: {},
      };
      catalog.getEntityByRef.mockResolvedValue(expected);

      const actual = await sut.getByEntityRef(ref);

      expect(actual).toBe(expected);
      expect(catalog.getEntityByRef).toHaveBeenCalledWith(ref, {
        token: 'mock-service-token:{"sub":"plugin:test","target":"catalog"}',
      });
    });
  });
});

function setup() {
  const catalog = mockInstance(CatalogClient);
  const auth = mockServices.auth();
  const sut = new CatalogUserEntityProvider({ catalog, auth });
  return { sut, catalog, auth };
}
