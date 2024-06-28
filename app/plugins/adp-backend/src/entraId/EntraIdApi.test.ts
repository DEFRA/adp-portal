import { ConfigReader } from '@backstage/config';
import { EntraIdApi } from './EntraIdApi';
import type { DeliveryProjectUser } from '@internal/plugin-adp-common';
import { faker } from '@faker-js/faker';
import type { FetchApi } from '@internal/plugin-fetch-api-backend';
import type { TokenProvider } from '@internal/plugin-credentials-context-backend';
import { randomUUID } from 'node:crypto';

describe('EntraIdApi', () => {
  function setup() {
    const config = new ConfigReader({
      adp: {
        entraIdGroups: {
          apiBaseUrl: 'https://portal-api/aadGroups',
        },
      },
    });

    const fetchApi: jest.Mocked<FetchApi> = {
      fetch: jest.fn(),
    };
    const tokens: jest.Mocked<TokenProvider> = {
      getLimitedUserToken: jest.fn(),
      getPluginRequestToken: jest.fn(),
    };

    const sut = new EntraIdApi({ config, fetchApi, tokens });

    return { sut, fetchApi, config, tokens };
  }

  describe('createEntraIdGroupsForProject', () => {
    it('should call the API with the correct parameters', async () => {
      // Arrange
      const { sut, fetchApi, tokens } = setup();
      const token = randomUUID();
      const projectName = 'test-project';
      const expectedMembers: DeliveryProjectUser[] = [
        {
          id: faker.string.uuid(),
          delivery_project_id: faker.string.uuid(),
          email: 'adminTechUser@test.com',
          is_admin: true,
          is_technical: true,
          name: 'Admin Tech User',
          aad_entity_ref_id: faker.string.uuid(),
          updated_at: faker.date.recent(),
          aad_user_principal_name: 'adminTechUser@test.com',
        },
        {
          id: faker.string.uuid(),
          delivery_project_id: faker.string.uuid(),
          email: 'adminNonTechUser@test.com',
          is_admin: true,
          is_technical: false,
          name: 'Admin Non Tech User',
          aad_entity_ref_id: faker.string.uuid(),
          updated_at: faker.date.recent(),
          aad_user_principal_name: 'adminNonTechUser@test.com',
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
          aad_user_principal_name: 'techUser@test.com',
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
          aad_user_principal_name: 'nonTechUser@test.com',
        },
      ];

      fetchApi.fetch.mockResolvedValue(
        new Response(undefined, { status: 204 }),
      );
      tokens.getLimitedUserToken.mockResolvedValueOnce({
        token,
        expiresAt: new Date(),
      });

      // Act
      await sut.createEntraIdGroupsForProject(expectedMembers, projectName);

      // Assert
      expect(fetchApi.fetch.mock.calls).toMatchObject([
        [
          `https://portal-api/aadGroups/${projectName}/groups-config`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: '{"techUserMembers":["adminTechUser@test.com","techUser@test.com"],"nonTechUserMembers":["adminNonTechUser@test.com","nonTechUser@test.com"],"adminMembers":["adminTechUser@test.com","adminNonTechUser@test.com"]}',
          },
        ],
      ]);
    });

    it('should throw an error when the API call is not successful', async () => {
      // Arrange
      const { sut, fetchApi, tokens } = setup();
      const token = randomUUID();
      const projectName = 'test-project';
      const expectedMembers: DeliveryProjectUser[] = [
        {
          id: faker.string.uuid(),
          delivery_project_id: faker.string.uuid(),
          email: 'adminTechUser@test.com',
          is_admin: true,
          is_technical: true,
          name: 'Admin Tech User',
          aad_entity_ref_id: faker.string.uuid(),
          updated_at: faker.date.recent(),
          aad_user_principal_name: 'adminTechUser@test.com',
        },
        {
          id: faker.string.uuid(),
          delivery_project_id: faker.string.uuid(),
          email: 'adminNonTechUser@test.com',
          is_admin: true,
          is_technical: false,
          name: 'Admin Non Tech User',
          aad_entity_ref_id: faker.string.uuid(),
          updated_at: faker.date.recent(),
          aad_user_principal_name: 'adminNonTechUser@test.com',
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

      fetchApi.fetch.mockResolvedValue(
        new Response(undefined, { status: 400 }),
      );
      tokens.getLimitedUserToken.mockResolvedValueOnce({
        token,
        expiresAt: new Date(),
      });

      // Act and assert
      await expect(
        sut.createEntraIdGroupsForProject(expectedMembers, projectName),
      ).rejects.toThrow(/Failed to create Entra ID groups for project/);
    });
  });

  describe('setProjectGroupMembers', () => {
    it('should call the API with the correct parameters', async () => {
      // Arrange
      const { sut, fetchApi, tokens } = setup();
      const token = randomUUID();
      const projectName = 'test-project';
      const expectedMembers: DeliveryProjectUser[] = [
        {
          id: faker.string.uuid(),
          delivery_project_id: faker.string.uuid(),
          email: 'adminTechUser@test.com',
          is_admin: true,
          is_technical: true,
          name: 'Admin Tech User',
          aad_entity_ref_id: faker.string.uuid(),
          updated_at: faker.date.recent(),
          aad_user_principal_name: 'adminTechUser@test.com',
        },
        {
          id: faker.string.uuid(),
          delivery_project_id: faker.string.uuid(),
          email: 'adminNonTechUser@test.com',
          is_admin: true,
          is_technical: false,
          name: 'Admin Non Tech User',
          aad_entity_ref_id: faker.string.uuid(),
          updated_at: faker.date.recent(),
          aad_user_principal_name: 'adminNonTechUser@test.com',
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
          aad_user_principal_name: 'techUser@test.com',
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
          aad_user_principal_name: 'nonTechUser@test.com',
        },
      ];

      fetchApi.fetch.mockResolvedValue(
        new Response(undefined, { status: 204 }),
      );
      tokens.getLimitedUserToken.mockResolvedValueOnce({
        token,
        expiresAt: new Date(),
      });

      // Act
      await sut.setProjectGroupMembers(expectedMembers, projectName);

      // Assert
      expect(fetchApi.fetch.mock.calls).toMatchObject([
        [
          `https://portal-api/aadGroups/${projectName}/members`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: '{"techUserMembers":["adminTechUser@test.com","techUser@test.com"],"nonTechUserMembers":["adminNonTechUser@test.com","nonTechUser@test.com"],"adminMembers":["adminTechUser@test.com","adminNonTechUser@test.com"]}',
          },
        ],
      ]);
    });

    it('should throw an error when the API call is not successfull', async () => {
      // Arrange
      const { sut, fetchApi, tokens } = setup();
      const token = randomUUID();
      const projectName = 'test-project';
      const expectedMembers: DeliveryProjectUser[] = [
        {
          id: faker.string.uuid(),
          delivery_project_id: faker.string.uuid(),
          email: 'adminTechUser@test.com',
          is_admin: true,
          is_technical: true,
          name: 'Admin Tech User',
          aad_entity_ref_id: faker.string.uuid(),
          updated_at: faker.date.recent(),
          aad_user_principal_name: 'adminTechUser@test.com',
        },
        {
          id: faker.string.uuid(),
          delivery_project_id: faker.string.uuid(),
          email: 'adminNonTechUser@test.com',
          is_admin: true,
          is_technical: false,
          name: 'Admin Non Tech User',
          aad_entity_ref_id: faker.string.uuid(),
          updated_at: faker.date.recent(),
          aad_user_principal_name: 'adminNonTechUser@test.com',
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

      fetchApi.fetch.mockResolvedValue(
        new Response(undefined, { status: 400 }),
      );
      tokens.getLimitedUserToken.mockResolvedValueOnce({
        token,
        expiresAt: new Date(),
      });

      // Act and assert
      await expect(
        sut.setProjectGroupMembers(expectedMembers, projectName),
      ).rejects.toThrow(/Failed to set Entra ID group members for project/);
    });
  });
});
