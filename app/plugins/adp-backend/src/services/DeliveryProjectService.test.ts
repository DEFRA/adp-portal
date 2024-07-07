import type { IdentityProvider } from '@internal/plugin-credentials-context-backend';
import { DeliveryProjectStore, FluxConfigApi } from '../deliveryProject';
import { DeliveryProjectGithubTeamsSyncronizer } from '../githubTeam';
import { DeliveryProgrammeAdminService } from './DeliveryProgrammeAdminService';
import { DeliveryProjectService } from './DeliveryProjectService';
import type { FireAndForgetCatalogRefresher } from './fireAndForgetCatalogRefresher';
import { mockServices } from '@backstage/backend-test-utils';
import { DeliveryProjectUserService } from './DeliveryProjectUserService';
import type {
  DeliveryProgrammeAdmin,
  DeliveryProjectUser,
  CreateDeliveryProjectRequest,
  DeliveryProject,
  UpdateDeliveryProjectRequest,
} from '@internal/plugin-adp-common';
import { randomUUID } from 'node:crypto';

describe('DeliveryProjectService', () => {
  describe('#create', () => {
    it('Should refresh the catalog, create the flux manifest, and syncronize the github teams when adding the project is successful', async () => {
      const {
        sut,
        store,
        catalogRefresher,
        fluxConfigApi,
        githubSyncronizer,
        identityProvider,
      } = setup();
      const ref = randomUUID();
      const data: CreateDeliveryProjectRequest = {
        ado_project: randomUUID(),
        delivery_programme_id: randomUUID(),
        delivery_project_code: randomUUID(),
        description: randomUUID(),
        github_team_visibility: Math.random() > 0.5 ? 'private' : 'public',
        service_owner: randomUUID(),
        team_type: randomUUID(),
        title: randomUUID(),
        alias: randomUUID(),
        finance_code: randomUUID(),
      };
      const expected: DeliveryProject = {
        ado_project: randomUUID(),
        created_at: new Date(),
        delivery_programme_code: randomUUID(),
        delivery_programme_id: randomUUID(),
        delivery_project_code: randomUUID(),
        description: randomUUID(),
        id: randomUUID(),
        name: randomUUID(),
        namespace: randomUUID(),
        service_owner: randomUUID(),
        team_type: randomUUID(),
        title: randomUUID(),
        updated_at: new Date(),
        alias: randomUUID(),
        delivery_programme_admins: [],
        delivery_project_users: [],
        finance_code: randomUUID(),
        github_team_visibility: Math.random() > 0.5 ? 'private' : 'public',
        updated_by: randomUUID(),
      };
      identityProvider.getCurrentIdentity.mockResolvedValueOnce({
        ownershipEntityRefs: [],
        userEntityRef: ref,
      });
      store.add.mockResolvedValueOnce({
        success: true,
        value: expected,
      });

      const actual = await sut.create(data);

      expect(actual).toEqual({
        success: true,
        value: expected,
      });
      expect(identityProvider.getCurrentIdentity).toHaveBeenCalledTimes(1);
      expect(store.add).toHaveBeenCalledTimes(1);
      expect(store.add).toHaveBeenCalledWith(data, ref);
      expect(githubSyncronizer.syncronizeById).toHaveBeenCalledTimes(1);
      expect(githubSyncronizer.syncronizeById).toHaveBeenCalledWith(
        expected.id,
      );
      expect(fluxConfigApi.createFluxConfig).toHaveBeenCalledTimes(1);
      expect(fluxConfigApi.createFluxConfig).toHaveBeenCalledWith(expected);
      expect(catalogRefresher.refresh).toHaveBeenCalledTimes(1);
      expect(catalogRefresher.refresh).toHaveBeenCalledWith(
        'location:default/delivery-projects',
      );
    });
    it('Should not refresh the catalog, create the flux manifest, or syncronize the github teams when adding the project fails', async () => {
      const {
        sut,
        store,
        catalogRefresher,
        fluxConfigApi,
        githubSyncronizer,
        identityProvider,
      } = setup();
      const ref = randomUUID();
      const data: CreateDeliveryProjectRequest = {
        ado_project: randomUUID(),
        delivery_programme_id: randomUUID(),
        delivery_project_code: randomUUID(),
        description: randomUUID(),
        github_team_visibility: Math.random() > 0.5 ? 'private' : 'public',
        service_owner: randomUUID(),
        team_type: randomUUID(),
        title: randomUUID(),
        alias: randomUUID(),
        finance_code: randomUUID(),
      };
      const expected = [
        'duplicateTitle',
        'duplicateName',
        'unknownDeliveryProgramme',
        'unknown',
      ] as const;
      identityProvider.getCurrentIdentity.mockResolvedValueOnce({
        ownershipEntityRefs: [],
        userEntityRef: ref,
      });
      store.add.mockResolvedValueOnce({
        success: false,
        errors: [...expected],
      });

      const actual = await sut.create(data);

      expect(actual).toEqual({
        success: false,
        errors: expected,
      });
      expect(identityProvider.getCurrentIdentity).toHaveBeenCalledTimes(1);
      expect(store.add).toHaveBeenCalledTimes(1);
      expect(store.add).toHaveBeenCalledWith(data, ref);
      expect(githubSyncronizer.syncronizeById).toHaveBeenCalledTimes(0);
      expect(fluxConfigApi.createFluxConfig).toHaveBeenCalledTimes(0);
      expect(catalogRefresher.refresh).toHaveBeenCalledTimes(0);
    });
  });
  describe('#edit', () => {
    it('Should refresh the catalog and syncronize the github teams when editing the project is successful', async () => {
      const {
        sut,
        store,
        catalogRefresher,
        fluxConfigApi,
        githubSyncronizer,
        identityProvider,
      } = setup();
      const ref = randomUUID();
      const data: UpdateDeliveryProjectRequest = {
        id: randomUUID(),
        ado_project: randomUUID(),
        delivery_programme_id: randomUUID(),
        delivery_project_code: randomUUID(),
        description: randomUUID(),
        github_team_visibility: Math.random() > 0.5 ? 'private' : 'public',
        service_owner: randomUUID(),
        team_type: randomUUID(),
        title: randomUUID(),
        alias: randomUUID(),
        finance_code: randomUUID(),
      };
      const expected: DeliveryProject = {
        ado_project: randomUUID(),
        created_at: new Date(),
        delivery_programme_code: randomUUID(),
        delivery_programme_id: randomUUID(),
        delivery_project_code: randomUUID(),
        description: randomUUID(),
        id: randomUUID(),
        name: randomUUID(),
        namespace: randomUUID(),
        service_owner: randomUUID(),
        team_type: randomUUID(),
        title: randomUUID(),
        updated_at: new Date(),
        alias: randomUUID(),
        delivery_programme_admins: [],
        delivery_project_users: [],
        finance_code: randomUUID(),
        github_team_visibility: Math.random() > 0.5 ? 'private' : 'public',
        updated_by: randomUUID(),
      };
      identityProvider.getCurrentIdentity.mockResolvedValueOnce({
        ownershipEntityRefs: [],
        userEntityRef: ref,
      });
      store.update.mockResolvedValueOnce({
        success: true,
        value: expected,
      });

      const actual = await sut.edit(data);

      expect(actual).toEqual({
        success: true,
        value: expected,
      });
      expect(identityProvider.getCurrentIdentity).toHaveBeenCalledTimes(1);
      expect(store.update).toHaveBeenCalledTimes(1);
      expect(store.update).toHaveBeenCalledWith(data, ref);
      expect(githubSyncronizer.syncronizeById).toHaveBeenCalledTimes(1);
      expect(githubSyncronizer.syncronizeById).toHaveBeenCalledWith(
        expected.id,
      );
      expect(fluxConfigApi.createFluxConfig).toHaveBeenCalledTimes(0);
      expect(catalogRefresher.refresh).toHaveBeenCalledTimes(1);
      expect(catalogRefresher.refresh).toHaveBeenCalledWith(
        'location:default/delivery-projects',
      );
    });
    it('Should not refresh the catalog or syncronize the github teams when editing the project fails', async () => {
      const {
        sut,
        store,
        catalogRefresher,
        fluxConfigApi,
        githubSyncronizer,
        identityProvider,
      } = setup();
      const ref = randomUUID();
      const data: UpdateDeliveryProjectRequest = {
        id: randomUUID(),
        ado_project: randomUUID(),
        delivery_programme_id: randomUUID(),
        delivery_project_code: randomUUID(),
        description: randomUUID(),
        github_team_visibility: Math.random() > 0.5 ? 'private' : 'public',
        service_owner: randomUUID(),
        team_type: randomUUID(),
        title: randomUUID(),
        alias: randomUUID(),
        finance_code: randomUUID(),
      };
      const expected = [
        'duplicateTitle',
        'unknownDeliveryProgramme',
        'unknown',
      ] as const;
      identityProvider.getCurrentIdentity.mockResolvedValueOnce({
        ownershipEntityRefs: [],
        userEntityRef: ref,
      });
      store.update.mockResolvedValueOnce({
        success: false,
        errors: [...expected],
      });

      const actual = await sut.edit(data);

      expect(actual).toEqual({
        success: false,
        errors: expected,
      });
      expect(identityProvider.getCurrentIdentity).toHaveBeenCalledTimes(1);
      expect(store.update).toHaveBeenCalledTimes(1);
      expect(store.update).toHaveBeenCalledWith(data, ref);
      expect(githubSyncronizer.syncronizeById).toHaveBeenCalledTimes(0);
      expect(fluxConfigApi.createFluxConfig).toHaveBeenCalledTimes(0);
      expect(catalogRefresher.refresh).toHaveBeenCalledTimes(0);
    });
  });
  describe('#getAll', () => {
    it('Should return all the data from the store', async () => {
      const { sut, store } = setup();
      const expected = [...new Array(10)].map<DeliveryProject>(() => ({
        ado_project: randomUUID(),
        created_at: new Date(),
        delivery_programme_code: randomUUID(),
        delivery_programme_id: randomUUID(),
        delivery_project_code: randomUUID(),
        description: randomUUID(),
        id: randomUUID(),
        name: randomUUID(),
        namespace: randomUUID(),
        service_owner: randomUUID(),
        team_type: randomUUID(),
        title: randomUUID(),
        updated_at: new Date(),
        alias: randomUUID(),
        delivery_programme_admins: [],
        delivery_project_users: [],
        finance_code: randomUUID(),
        github_team_visibility: Math.random() > 0.5 ? 'private' : 'public',
        updated_by: randomUUID(),
      }));
      store.getAll.mockResolvedValueOnce(expected);

      const actual = await sut.getAll();

      expect(actual).toBe(expected);
      expect(store.getAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('#getById', () => {
    it('Should return the record from the store and enrich it with the programme admins and project users', async () => {
      const { sut, store, admins, users } = setup();
      const id = randomUUID();
      const expected: DeliveryProject = {
        ado_project: randomUUID(),
        created_at: new Date(),
        delivery_programme_code: randomUUID(),
        delivery_programme_id: randomUUID(),
        delivery_project_code: randomUUID(),
        description: randomUUID(),
        id: randomUUID(),
        name: randomUUID(),
        namespace: randomUUID(),
        service_owner: randomUUID(),
        team_type: randomUUID(),
        title: randomUUID(),
        updated_at: new Date(),
        alias: randomUUID(),
        delivery_programme_admins: [
          ...new Array(10),
        ].map<DeliveryProgrammeAdmin>(() => ({
          aad_entity_ref_id: randomUUID(),
          delivery_programme_id: randomUUID(),
          email: randomUUID(),
          id: randomUUID(),
          name: randomUUID(),
          updated_at: new Date(),
          user_entity_ref: randomUUID(),
        })),
        delivery_project_users: [...new Array(10)].map<DeliveryProjectUser>(
          () => ({
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
          }),
        ),
        finance_code: randomUUID(),
        github_team_visibility: Math.random() > 0.5 ? 'private' : 'public',
        updated_by: randomUUID(),
      };

      const {
        delivery_programme_admins: _,
        delivery_project_users: __,
        ...storeResult
      } = expected;
      store.get.mockResolvedValueOnce(storeResult);
      admins.getByProgrammeId.mockResolvedValueOnce(
        expected.delivery_programme_admins!,
      );
      users.getByProjectId.mockResolvedValueOnce(
        expected.delivery_project_users!,
      );

      const actual = await sut.getById(id);

      expect(actual).toEqual(expected);
      expect(store.get).toHaveBeenCalledTimes(1);
      expect(store.get).toHaveBeenCalledWith(id);
      expect(admins.getByProgrammeId).toHaveBeenCalledTimes(1);
      expect(admins.getByProgrammeId).toHaveBeenCalledWith(
        expected.delivery_programme_id,
      );
      expect(users.getByProjectId).toHaveBeenCalledTimes(1);
      expect(users.getByProjectId).toHaveBeenCalledWith(id);
    });
  });
});

function setup() {
  const admins = mockInstance(DeliveryProgrammeAdminService);
  const catalogRefresher: jest.Mocked<FireAndForgetCatalogRefresher> = {
    refresh: jest.fn(),
  };
  const fluxConfigApi = mockInstance(FluxConfigApi);
  const githubSyncronizer = mockInstance(DeliveryProjectGithubTeamsSyncronizer);
  const identityProvider: jest.Mocked<IdentityProvider> = {
    getCurrentIdentity: jest.fn(),
  };
  const logger = mockServices.logger.mock();
  const store = mockInstance(DeliveryProjectStore);
  const users = mockInstance(DeliveryProjectUserService);

  const sut = new DeliveryProjectService({
    admins,
    catalogRefresher,
    fluxConfigApi,
    githubSyncronizer,
    identityProvider,
    logger,
    store,
    users,
  });
  return {
    sut,
    users,
    admins,
    catalogRefresher,
    fluxConfigApi,
    githubSyncronizer,
    identityProvider,
    logger,
    store,
  };
}
