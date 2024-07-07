import { DeliveryProjectGithubTeamsSyncronizer } from '../githubTeam';
import type { FireAndForgetCatalogRefresher } from './fireAndForgetCatalogRefresher';
import { mockServices } from '@backstage/backend-test-utils';
import { DeliveryProjectUserService } from './DeliveryProjectUserService';
import type { DeliveryProjectUser } from '@internal/plugin-adp-common';
import { randomUUID } from 'node:crypto';
import { DeliveryProjectUserStore } from '../deliveryProjectUser';
import { DeliveryProjectEntraIdGroupsSyncronizer } from '../entraId';
import { CatalogUserEntityProvider } from './CatalogUserEntityProvider';
import {
  MICROSOFT_EMAIL_ANNOTATION,
  MICROSOFT_GRAPH_USER_ID_ANNOTATION,
} from '@backstage/plugin-catalog-backend-module-msgraph';
import { NotFoundError } from '@backstage/errors';

describe('DeliveryProjectUserService', () => {
  describe('#add', () => {
    it('Should syncronize github, entra, and the catalog when successfully added', async () => {
      const {
        sut,
        entraSyncronizer,
        githubSyncronizer,
        catalogRefresher,
        store,
        userEntities,
      } = setup();
      const projectId = randomUUID();
      const userRef = randomUUID();
      const userDisplay = randomUUID();
      const userEmail = randomUUID();
      const userId = randomUUID();
      const userPrincipal = randomUUID();
      const data: Parameters<typeof sut.add>[2] = {
        is_technical: Math.random() > 0.5,
        is_admin: Math.random() > 0.5,
        github_username: randomUUID(),
      };
      const expected: DeliveryProjectUser = {
        aad_entity_ref_id: randomUUID(),
        delivery_project_id: randomUUID(),
        email: randomUUID(),
        id: randomUUID(),
        is_admin: Math.random() > 0.5,
        is_technical: Math.random() > 0.5,
        name: randomUUID(),
        updated_at: new Date(),
        aad_user_principal_name: randomUUID(),
        github_username: randomUUID(),
        user_entity_ref: randomUUID(),
      };
      store.add.mockResolvedValueOnce({ success: true, value: expected });
      userEntities.getByEntityRef.mockResolvedValueOnce({
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'User',
        metadata: {
          name: randomUUID(),
          annotations: {
            [MICROSOFT_EMAIL_ANNOTATION]: userEmail,
            [MICROSOFT_GRAPH_USER_ID_ANNOTATION]: userId,
            ['graph.microsoft.com/user-principal-name']: userPrincipal,
          },
        },
        spec: {
          profile: {
            displayName: userDisplay,
          },
        },
      });

      const actual = await sut.add(projectId, userRef, data);

      expect(actual).toEqual({
        success: true,
        value: expected,
      });
      expect(userEntities.getByEntityRef).toHaveBeenCalledTimes(1);
      expect(userEntities.getByEntityRef).toHaveBeenCalledWith(userRef);
      expect(store.add).toHaveBeenCalledTimes(1);
      expect(store.add).toHaveBeenCalledWith({
        is_technical: data.is_technical,
        is_admin: data.is_admin,
        github_username: data.github_username,
        name: userDisplay,
        email: userEmail,
        aad_entity_ref_id: userId,
        aad_user_principal_name: userPrincipal,
        delivery_project_id: projectId,
        user_entity_ref: userRef,
      });
      expect(catalogRefresher.refresh).toHaveBeenCalledTimes(1);
      expect(catalogRefresher.refresh).toHaveBeenCalledWith(
        'location:default/delivery-projects',
      );
      expect(githubSyncronizer.syncronizeById).toHaveBeenCalledTimes(1);
      expect(githubSyncronizer.syncronizeById).toHaveBeenCalledWith(projectId);
      expect(entraSyncronizer.syncronizeById).toHaveBeenCalledTimes(1);
      expect(entraSyncronizer.syncronizeById).toHaveBeenCalledWith(projectId);
    });
    it('Should not syncronize github, entra, or the catalog when failing to add', async () => {
      const {
        sut,
        entraSyncronizer,
        githubSyncronizer,
        catalogRefresher,
        store,
        userEntities,
      } = setup();
      const projectId = randomUUID();
      const userRef = randomUUID();
      const userDisplay = randomUUID();
      const userEmail = randomUUID();
      const userId = randomUUID();
      const userPrincipal = randomUUID();
      const data: Parameters<typeof sut.add>[2] = {
        is_technical: Math.random() > 0.5,
        is_admin: Math.random() > 0.5,
        github_username: randomUUID(),
      };
      const expected = [
        'duplicateUser',
        'unknownDeliveryProject',
        'unknown',
      ] as const;
      store.add.mockResolvedValueOnce({
        success: false,
        errors: [...expected],
      });
      userEntities.getByEntityRef.mockResolvedValueOnce({
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'User',
        metadata: {
          name: randomUUID(),
          annotations: {
            [MICROSOFT_EMAIL_ANNOTATION]: userEmail,
            [MICROSOFT_GRAPH_USER_ID_ANNOTATION]: userId,
            ['graph.microsoft.com/user-principal-name']: userPrincipal,
          },
        },
        spec: {
          profile: {
            displayName: userDisplay,
          },
        },
      });

      const actual = await sut.add(projectId, userRef, data);

      expect(actual).toEqual({
        success: false,
        errors: expected,
      });
      expect(userEntities.getByEntityRef).toHaveBeenCalledTimes(1);
      expect(userEntities.getByEntityRef).toHaveBeenCalledWith(userRef);
      expect(store.add).toHaveBeenCalledTimes(1);
      expect(store.add).toHaveBeenCalledWith({
        is_technical: data.is_technical,
        is_admin: data.is_admin,
        github_username: data.github_username,
        name: userDisplay,
        email: userEmail,
        aad_entity_ref_id: userId,
        aad_user_principal_name: userPrincipal,
        delivery_project_id: projectId,
        user_entity_ref: userRef,
      });
      expect(catalogRefresher.refresh).toHaveBeenCalledTimes(0);
      expect(githubSyncronizer.syncronizeById).toHaveBeenCalledTimes(0);
      expect(entraSyncronizer.syncronizeById).toHaveBeenCalledTimes(0);
    });
  });
  describe('#edit', () => {
    it('Should syncronize github, entra, and the catalog when successfully edited', async () => {
      const {
        sut,
        entraSyncronizer,
        githubSyncronizer,
        catalogRefresher,
        store,
        userEntities,
      } = setup();
      const id = randomUUID();
      const projectId = randomUUID();
      const data: Parameters<typeof sut.edit>[1] = {
        is_technical: Math.random() > 0.5,
        is_admin: Math.random() > 0.5,
        github_username: randomUUID(),
      };
      const expected: DeliveryProjectUser = {
        aad_entity_ref_id: randomUUID(),
        delivery_project_id: projectId,
        email: randomUUID(),
        id: randomUUID(),
        is_admin: Math.random() > 0.5,
        is_technical: Math.random() > 0.5,
        name: randomUUID(),
        updated_at: new Date(),
        aad_user_principal_name: randomUUID(),
        github_username: randomUUID(),
        user_entity_ref: randomUUID(),
      };
      store.update.mockResolvedValueOnce({ success: true, value: expected });

      const actual = await sut.edit(id, data);

      expect(actual).toEqual({
        success: true,
        value: expected,
      });
      expect(userEntities.getByEntityRef).toHaveBeenCalledTimes(0);
      expect(store.update).toHaveBeenCalledTimes(1);
      expect(store.update).toHaveBeenCalledWith({
        id: id,
        is_technical: data.is_technical,
        is_admin: data.is_admin,
        github_username: data.github_username,
      });
      expect(catalogRefresher.refresh).toHaveBeenCalledTimes(1);
      expect(catalogRefresher.refresh).toHaveBeenCalledWith(
        'location:default/delivery-projects',
      );
      expect(githubSyncronizer.syncronizeById).toHaveBeenCalledTimes(1);
      expect(githubSyncronizer.syncronizeById).toHaveBeenCalledWith(projectId);
      expect(entraSyncronizer.syncronizeById).toHaveBeenCalledTimes(1);
      expect(entraSyncronizer.syncronizeById).toHaveBeenCalledWith(projectId);
    });
    it('Should not syncronize github, entra, or the catalog when failing to update', async () => {
      const {
        sut,
        entraSyncronizer,
        githubSyncronizer,
        catalogRefresher,
        store,
        userEntities,
      } = setup();
      const id = randomUUID();
      const data: Parameters<typeof sut.edit>[1] = {
        is_technical: Math.random() > 0.5,
        is_admin: Math.random() > 0.5,
        github_username: randomUUID(),
      };
      const expected = ['unknown'] as const;
      store.update.mockResolvedValueOnce({
        success: false,
        errors: [...expected],
      });

      const actual = await sut.edit(id, data);

      expect(actual).toEqual({
        success: false,
        errors: expected,
      });
      expect(userEntities.getByEntityRef).toHaveBeenCalledTimes(0);
      expect(store.update).toHaveBeenCalledTimes(1);
      expect(store.update).toHaveBeenCalledWith({
        id: id,
        is_technical: data.is_technical,
        is_admin: data.is_admin,
        github_username: data.github_username,
      });
      expect(catalogRefresher.refresh).toHaveBeenCalledTimes(0);
      expect(githubSyncronizer.syncronizeById).toHaveBeenCalledTimes(0);
      expect(entraSyncronizer.syncronizeById).toHaveBeenCalledTimes(0);
    });
  });
  describe('#remove', () => {
    it('Should syncronize github, entra, and the catalog when successfully removed', async () => {
      const {
        sut,
        entraSyncronizer,
        githubSyncronizer,
        catalogRefresher,
        store,
        userEntities,
      } = setup();
      const id = randomUUID();
      const projectId = randomUUID();
      store.delete.mockResolvedValueOnce(true);
      store.get.mockResolvedValueOnce({
        aad_entity_ref_id: randomUUID(),
        delivery_project_id: projectId,
        email: randomUUID(),
        id: randomUUID(),
        is_admin: Math.random() > 0.5,
        is_technical: Math.random() > 0.5,
        name: randomUUID(),
        updated_at: new Date(),
        aad_user_principal_name: randomUUID(),
        github_username: randomUUID(),
        user_entity_ref: randomUUID(),
      });

      const actual = await sut.remove(id);

      expect(actual).toEqual(undefined);
      expect(userEntities.getByEntityRef).toHaveBeenCalledTimes(0);
      expect(store.get).toHaveBeenCalledTimes(1);
      expect(store.get).toHaveBeenCalledWith(id);
      expect(store.delete).toHaveBeenCalledTimes(1);
      expect(store.delete).toHaveBeenCalledWith(id);
      expect(catalogRefresher.refresh).toHaveBeenCalledTimes(1);
      expect(catalogRefresher.refresh).toHaveBeenCalledWith(
        'location:default/delivery-projects',
      );
      expect(githubSyncronizer.syncronizeById).toHaveBeenCalledTimes(1);
      expect(githubSyncronizer.syncronizeById).toHaveBeenCalledWith(projectId);
      expect(entraSyncronizer.syncronizeById).toHaveBeenCalledTimes(1);
      expect(entraSyncronizer.syncronizeById).toHaveBeenCalledWith(projectId);
    });
    it('Should not syncronize github, entra, or the catalog when failing to remove', async () => {
      const {
        sut,
        entraSyncronizer,
        githubSyncronizer,
        catalogRefresher,
        store,
        userEntities,
      } = setup();
      const id = randomUUID();
      store.get.mockRejectedValueOnce(new NotFoundError());

      const actual = await sut.remove(id);

      expect(actual).toEqual(undefined);
      expect(userEntities.getByEntityRef).toHaveBeenCalledTimes(0);
      expect(store.get).toHaveBeenCalledTimes(1);
      expect(store.get).toHaveBeenCalledWith(id);
      expect(store.delete).toHaveBeenCalledTimes(0);
      expect(catalogRefresher.refresh).toHaveBeenCalledTimes(0);
      expect(githubSyncronizer.syncronizeById).toHaveBeenCalledTimes(0);
      expect(entraSyncronizer.syncronizeById).toHaveBeenCalledTimes(0);
    });
  });

  describe('#getAll', () => {
    it('Should return all the data from the store', async () => {
      const { sut, store } = setup();
      const expected = [...new Array(10)].map<DeliveryProjectUser>(() => ({
        aad_entity_ref_id: randomUUID(),
        delivery_project_id: randomUUID(),
        email: randomUUID(),
        id: randomUUID(),
        is_admin: Math.random() > 0.5,
        is_technical: Math.random() > 0.5,
        name: randomUUID(),
        updated_at: new Date(),
        aad_user_principal_name: randomUUID(),
        github_username: randomUUID(),
        user_entity_ref: randomUUID(),
      }));
      store.getAll.mockResolvedValueOnce(expected);

      const actual = await sut.getAll();

      expect(actual).toBe(expected);
      expect(store.getAll).toHaveBeenCalledTimes(1);
    });
  });
  describe('#getByProjectId', () => {
    it('Should return all the data from the store', async () => {
      const { sut, store } = setup();
      const projectId = randomUUID();
      const expected = [...new Array(10)].map<DeliveryProjectUser>(() => ({
        aad_entity_ref_id: randomUUID(),
        delivery_project_id: randomUUID(),
        email: randomUUID(),
        id: randomUUID(),
        is_admin: Math.random() > 0.5,
        is_technical: Math.random() > 0.5,
        name: randomUUID(),
        updated_at: new Date(),
        aad_user_principal_name: randomUUID(),
        github_username: randomUUID(),
        user_entity_ref: randomUUID(),
      }));
      store.getByDeliveryProject.mockResolvedValueOnce(expected);

      const actual = await sut.getByProjectId(projectId);

      expect(actual).toBe(expected);
      expect(store.getByDeliveryProject).toHaveBeenCalledTimes(1);
      expect(store.getByDeliveryProject).toHaveBeenCalledWith(projectId);
    });
  });
});

function setup() {
  const catalogRefresher: jest.Mocked<FireAndForgetCatalogRefresher> = {
    refresh: jest.fn(),
  };
  const githubSyncronizer = mockInstance(DeliveryProjectGithubTeamsSyncronizer);
  const logger = mockServices.logger.mock();
  const store = mockInstance(DeliveryProjectUserStore);
  const entraSyncronizer = mockInstance(
    DeliveryProjectEntraIdGroupsSyncronizer,
  );
  const userEntities = mockInstance(CatalogUserEntityProvider);

  const sut = new DeliveryProjectUserService({
    catalogRefresher,
    githubSyncronizer,
    logger,
    store,
    entraSyncronizer,
    userEntities,
  });
  return {
    sut,
    catalogRefresher,
    githubSyncronizer,
    logger,
    store,
    entraSyncronizer,
    userEntities,
  };
}
