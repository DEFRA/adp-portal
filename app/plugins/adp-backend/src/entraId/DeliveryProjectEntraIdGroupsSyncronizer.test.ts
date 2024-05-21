import { faker } from '@faker-js/faker';
import type { IDeliveryProjectStore } from '../deliveryProject';
import type { IDeliveryProjectUserStore } from '../deliveryProjectUser';
import { DeliveryProjectEntraIdGroupsSyncronizer } from './DeliveryProjectEntraIdGroupsSyncronizer';
import type { IEntraIdApi } from './EntraIdApi';
import type { DeliveryProject } from '@internal/plugin-adp-common';
import { createDeliveryProjectUser } from '../testData/projectUserTestData';

describe('DeliveryProjectEntraIdGroupsSyncronizer', () => {
  function setup() {
    const entraIdApi: jest.Mocked<IEntraIdApi> = {
      createEntraIdGroupsForProject: jest.fn(),
      setProjectGroupMembers: jest.fn(),
    };
    const deliveryProjectStore: jest.Mocked<IDeliveryProjectStore> = {
      add: jest.fn(),
      get: jest.fn(),
      getAll: jest.fn(),
      getByName: jest.fn(),
      update: jest.fn(),
    };
    const deliveryProjectUserStore: jest.Mocked<IDeliveryProjectUserStore> = {
      add: jest.fn(),
      get: jest.fn(),
      getAll: jest.fn(),
      getByDeliveryProject: jest.fn(),
      update: jest.fn(),
    };

    const sut = new DeliveryProjectEntraIdGroupsSyncronizer(
      entraIdApi,
      deliveryProjectStore,
      deliveryProjectUserStore,
    );

    return { sut, deliveryProjectStore, deliveryProjectUserStore, entraIdApi };
  }

  it('should fail to syncronze an unknown project', async () => {
    // Arrange
    const { sut, deliveryProjectStore } = setup();
    const projectId = faker.string.uuid();

    deliveryProjectStore.getByName.mockRejectedValueOnce(
      new Error('Something broke'),
    );

    // Act and assert
    await expect(sut.syncronizeById(projectId)).rejects.toThrow();
  });

  it('should syncronize a valid project', async () => {
    // Arrange
    const { sut, deliveryProjectStore, deliveryProjectUserStore, entraIdApi } =
      setup();

    const project: DeliveryProject = {
      ado_project: faker.string.uuid(),
      created_at: faker.date.recent(),
      delivery_programme_code: faker.string.uuid(),
      delivery_programme_id: faker.string.uuid(),
      delivery_project_code: faker.string.uuid(),
      delivery_project_users: [],
      description: faker.commerce.productDescription(),
      id: faker.string.uuid(),
      name: faker.commerce.productName(),
      namespace: faker.string.uuid(),
      service_owner: faker.string.uuid(),
      team_type: faker.string.uuid(),
      title: faker.commerce.productName(),
      updated_at: faker.date.recent(),
    };
    const projectUsers = faker.helpers.multiple(
      () => createDeliveryProjectUser(project.id),
      {
        count: 3,
      },
    );

    deliveryProjectStore.get.mockResolvedValueOnce(project);
    deliveryProjectUserStore.getByDeliveryProject.mockResolvedValueOnce(
      projectUsers,
    );

    // Act
    await sut.syncronizeById(project.id);

    // Assert
    expect(entraIdApi.setProjectGroupMembers).toHaveBeenCalledWith(
      projectUsers,
      project.name,
    );
  });
});
