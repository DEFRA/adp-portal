import type { DeliveryProject } from '@internal/plugin-adp-common';
import { faker } from '@faker-js/faker';
import { isDeliveryProjectAdmin } from './isDeliveryProjectAdmin';

describe('isDeliveryProjectAdmin', () => {
  describe('apply', () => {
    it('returns true when the user is a Delivery Project Admin', () => {
      const deliveryProject: DeliveryProject = {
        ado_project: 'TEST-PROJECT',
        created_at: faker.date.recent(),
        delivery_programme_code: 'XYZ',
        delivery_programme_id: '123',
        delivery_project_code: 'ABC',
        delivery_project_users: [
          {
            aad_entity_ref_id: faker.string.uuid(),
            aad_user_principal_name: 'test-admin@test.com',
            delivery_project_id: faker.string.uuid(),
            email: 'test-admin@test.com',
            user_entity_ref: 'test-admin@test.com',
            id: faker.string.uuid(),
            is_admin: true,
            is_technical: false,
            name: 'Test Admin',
            updated_at: faker.date.recent(),
          },
          {
            aad_entity_ref_id: faker.string.uuid(),
            aad_user_principal_name: 'test-user@test.com',
            delivery_project_id: faker.string.uuid(),
            email: 'test-user@test.com',
            user_entity_ref: 'test-user@test.com',
            id: faker.string.uuid(),
            is_admin: true,
            is_technical: false,
            name: 'Test User',
            updated_at: faker.date.recent(),
          },
        ],
        delivery_programme_admins: [],
        description: 'Test project',
        id: faker.string.uuid(),
        name: 'Test Project',
        namespace: 'XYZ-ABC',
        service_owner: faker.internet.email(),
        team_type: 'test',
        title: 'Test Project',
        updated_at: faker.date.recent(),
      };

      expect(
        isDeliveryProjectAdmin.apply(deliveryProject, {
          userId: 'test-admin@test.com',
        }),
      ).toBeTruthy();
    });

    it('returns false when the user is not a Delivery Project Admin', () => {
      const deliveryProject: DeliveryProject = {
        ado_project: 'TEST-PROJECT',
        created_at: faker.date.recent(),
        delivery_programme_code: 'XYZ',
        delivery_programme_id: '123',
        delivery_project_code: 'ABC',
        delivery_project_users: [
          {
            aad_entity_ref_id: faker.string.uuid(),
            aad_user_principal_name: 'test-admin@test.com',
            delivery_project_id: faker.string.uuid(),
            email: 'test-admin@test.com',
            user_entity_ref: 'test-admin@test.com',
            id: faker.string.uuid(),
            is_admin: false,
            is_technical: false,
            name: 'Test Admin',
            updated_at: faker.date.recent(),
          },
          {
            aad_entity_ref_id: faker.string.uuid(),
            aad_user_principal_name: 'test-user@test.com',
            delivery_project_id: faker.string.uuid(),
            email: 'test-user@test.com',
            user_entity_ref: 'test-user@test.com',
            id: faker.string.uuid(),
            is_admin: true,
            is_technical: false,
            name: 'Test User',
            updated_at: faker.date.recent(),
          },
        ],
        delivery_programme_admins: [],
        description: 'Test project',
        id: faker.string.uuid(),
        name: 'Test Project',
        namespace: 'XYZ-ABC',
        service_owner: faker.internet.email(),
        team_type: 'test',
        title: 'Test Project',
        updated_at: faker.date.recent(),
      };

      expect(
        isDeliveryProjectAdmin.apply(deliveryProject, {
          userId: 'test-admin@test.com',
        }),
      ).toBeFalsy();
    });

    it('returns false when the user is not part of the Delivery Project', () => {
      const deliveryProject: DeliveryProject = {
        ado_project: 'TEST-PROJECT',
        created_at: faker.date.recent(),
        delivery_programme_code: 'XYZ',
        delivery_programme_id: '123',
        delivery_project_code: 'ABC',
        delivery_project_users: [
          {
            aad_entity_ref_id: faker.string.uuid(),
            aad_user_principal_name: 'test-user@test.com',
            delivery_project_id: faker.string.uuid(),
            email: 'test-user@test.com',
            user_entity_ref: 'test-user@test.com',
            id: faker.string.uuid(),
            is_admin: true,
            is_technical: false,
            name: 'Test User',
            updated_at: faker.date.recent(),
          },
        ],
        delivery_programme_admins: [],
        description: 'Test project',
        id: faker.string.uuid(),
        name: 'Test Project',
        namespace: 'XYZ-ABC',
        service_owner: faker.internet.email(),
        team_type: 'test',
        title: 'Test Project',
        updated_at: faker.date.recent(),
      };

      expect(
        isDeliveryProjectAdmin.apply(deliveryProject, {
          userId: 'test-admin@test.com',
        }),
      ).toBeFalsy();
    });

    it('returns false when the project does not have any users configured', () => {
      const deliveryProject: DeliveryProject = {
        ado_project: 'TEST-PROJECT',
        created_at: faker.date.recent(),
        delivery_programme_code: 'XYZ',
        delivery_programme_id: '123',
        delivery_project_code: 'ABC',
        delivery_project_users: [],
        delivery_programme_admins: [],
        description: 'Test project',
        id: faker.string.uuid(),
        name: 'Test Project',
        namespace: 'XYZ-ABC',
        service_owner: faker.internet.email(),
        team_type: 'test',
        title: 'Test Project',
        updated_at: faker.date.recent(),
      };

      expect(
        isDeliveryProjectAdmin.apply(deliveryProject, {
          userId: 'test-admin@test.com',
        }),
      ).toBeFalsy();
    });
  });
});
