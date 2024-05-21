import { ConfigReader } from '@backstage/config';
import type fetch from 'node-fetch';
import { Response } from 'node-fetch';
import { EntraIdApi } from './EntraIdApi';
import type { DeliveryProjectUser } from '@internal/plugin-adp-common';
import { faker } from '@faker-js/faker';

describe('EntraIdApi', () => {
  function setup() {
    const config = new ConfigReader({
      adp: {
        entraIdGroups: {
          apiBaseUrl: 'https://portal-api/aadGroups',
        },
      },
    });

    const fetchApi: jest.MockedFn<typeof fetch> = Object.assign(jest.fn(), {
      isRedirect: jest.fn(),
    });

    const sut = new EntraIdApi(config, fetchApi);

    return { sut, fetchApi, config };
  }

  describe('createEntraIdGroupsForProject', () => {
    it('should call the API with the correct parameters', async () => {
      // Arrange
      const { sut, fetchApi } = setup();
      const projectName = 'test-project';
      const expectedMembers: DeliveryProjectUser[] = [
        {
          id: faker.string.uuid(),
          delivery_project_id: faker.string.uuid(),
          email: 'adminUser@test.com',
          is_admin: true,
          is_technical: false,
          name: 'Admin User',
          aad_entity_ref_id: faker.string.uuid(),
          updated_at: faker.date.recent(),
        },
        {
          id: faker.string.uuid(),
          delivery_project_id: faker.string.uuid(),
          email: 'techUser@test.com',
          is_admin: false,
          is_technical: true,
          name: 'Tech User',
          aad_entity_ref_id: faker.string.uuid(),
          updated_at: faker.date.recent(),
        },
        {
          id: faker.string.uuid(),
          delivery_project_id: faker.string.uuid(),
          email: 'nonTechUser@test.com',
          is_admin: false,
          is_technical: false,
          name: 'Non Tech User',
          aad_entity_ref_id: faker.string.uuid(),
          updated_at: faker.date.recent(),
        },
      ];

      fetchApi.mockResolvedValue(
        new Response(JSON.stringify(''), { status: 204 }),
      );

      // Act
      await sut.createEntraIdGroupsForProject(expectedMembers, projectName);

      // Assert
      expect(fetchApi.mock.calls).toMatchObject([
        [
          `https://portal-api/aadGroups/${projectName}/groups-config`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: '{"techUserMembers":["techUser@test.com"],"nonTechUserMembers":["nonTechUser@test.com"],"adminMembers":["adminUser@test.com"]}',
          },
        ],
      ]);
    });

    it('should throw an error when the API call is not successful', async () => {
      // Arrange
      const { sut, fetchApi } = setup();
      const projectName = 'test-project';
      const expectedMembers: DeliveryProjectUser[] = [
        {
          id: faker.string.uuid(),
          delivery_project_id: faker.string.uuid(),
          email: 'adminUser@test.com',
          is_admin: true,
          is_technical: false,
          name: 'Admin User',
          aad_entity_ref_id: faker.string.uuid(),
          updated_at: faker.date.recent(),
        },
        {
          id: faker.string.uuid(),
          delivery_project_id: faker.string.uuid(),
          email: 'techUser@test.com',
          is_admin: false,
          is_technical: true,
          name: 'Tech User',
          aad_entity_ref_id: faker.string.uuid(),
          updated_at: faker.date.recent(),
        },
        {
          id: faker.string.uuid(),
          delivery_project_id: faker.string.uuid(),
          email: 'nonTechUser@test.com',
          is_admin: false,
          is_technical: false,
          name: 'Non Tech User',
          aad_entity_ref_id: faker.string.uuid(),
          updated_at: faker.date.recent(),
        },
      ];

      fetchApi.mockResolvedValue(new Response(undefined, { status: 400 }));

      // Act and assert
      await expect(
        sut.createEntraIdGroupsForProject(expectedMembers, projectName),
      ).rejects.toThrow(/Failed to create Entra ID groups for project/);
    });
  });

  describe('setProjectGroupMembers', () => {
    it('should call the API with the correct parameters', async () => {
      // Arrange
      const { sut, fetchApi } = setup();
      const projectName = 'test-project';
      const expectedMembers: DeliveryProjectUser[] = [
        {
          id: faker.string.uuid(),
          delivery_project_id: faker.string.uuid(),
          email: 'adminUser@test.com',
          is_admin: true,
          is_technical: false,
          name: 'Admin User',
          aad_entity_ref_id: faker.string.uuid(),
          updated_at: faker.date.recent(),
        },
        {
          id: faker.string.uuid(),
          delivery_project_id: faker.string.uuid(),
          email: 'techUser@test.com',
          is_admin: false,
          is_technical: true,
          name: 'Tech User',
          aad_entity_ref_id: faker.string.uuid(),
          updated_at: faker.date.recent(),
        },
        {
          id: faker.string.uuid(),
          delivery_project_id: faker.string.uuid(),
          email: 'nonTechUser@test.com',
          is_admin: false,
          is_technical: false,
          name: 'Non Tech User',
          aad_entity_ref_id: faker.string.uuid(),
          updated_at: faker.date.recent(),
        },
      ];

      fetchApi.mockResolvedValue(
        new Response(JSON.stringify(''), { status: 204 }),
      );

      // Act
      await sut.setProjectGroupMembers(expectedMembers, projectName);

      // Assert
      expect(fetchApi.mock.calls).toMatchObject([
        [
          `https://portal-api/aadGroups/${projectName}/members`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: '{"techUserMembers":["techUser@test.com"],"nonTechUserMembers":["nonTechUser@test.com"],"adminMembers":["adminUser@test.com"]}',
          },
        ],
      ]);
    });

    it('should throw an error when the API call is not successfull', async () => {
      // Arrange
      const { sut, fetchApi } = setup();
      const projectName = 'test-project';
      const expectedMembers: DeliveryProjectUser[] = [
        {
          id: faker.string.uuid(),
          delivery_project_id: faker.string.uuid(),
          email: 'adminUser@test.com',
          is_admin: true,
          is_technical: false,
          name: 'Admin User',
          aad_entity_ref_id: faker.string.uuid(),
          updated_at: faker.date.recent(),
        },
        {
          id: faker.string.uuid(),
          delivery_project_id: faker.string.uuid(),
          email: 'techUser@test.com',
          is_admin: false,
          is_technical: true,
          name: 'Tech User',
          aad_entity_ref_id: faker.string.uuid(),
          updated_at: faker.date.recent(),
        },
        {
          id: faker.string.uuid(),
          delivery_project_id: faker.string.uuid(),
          email: 'nonTechUser@test.com',
          is_admin: false,
          is_technical: false,
          name: 'Non Tech User',
          aad_entity_ref_id: faker.string.uuid(),
          updated_at: faker.date.recent(),
        },
      ];

      fetchApi.mockResolvedValue(new Response(undefined, { status: 400 }));

      // Act and assert
      await expect(
        sut.setProjectGroupMembers(expectedMembers, projectName),
      ).rejects.toThrow(/Failed to set Entra ID group members for project/);
    });
  });
});
