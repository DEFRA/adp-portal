import { faker } from '@faker-js/faker';
import type { DeliveryProgramme } from '@internal/plugin-adp-common';
import { isDeliveryProgrammeAdmin } from './isDeliveryProgrammeAdmin';

describe('isDeliveryProgrammeAdmin', () => {
  describe('apply', () => {
    it('returns true when the user is a Delivery Programme Admin', () => {
      const deliveryProgramme: DeliveryProgramme = {
        arms_length_body_id: faker.string.uuid(),
        created_at: faker.date.recent(),
        delivery_programme_admins: [
          {
            aad_entity_ref_id: faker.string.uuid(),
            delivery_programme_id: faker.string.uuid(),
            email: 'test@test.com',
            id: faker.string.uuid(),
            name: 'Test User',
            updated_at: faker.date.recent(),
            user_entity_ref: 'test@test.com',
          },
        ],
        delivery_programme_code: 'ABC',
        description: 'Test programme',
        id: faker.string.uuid(),
        name: 'Test Project',
        title: 'Test Project',
        updated_at: faker.date.recent(),
      };

      expect(
        isDeliveryProgrammeAdmin.apply(deliveryProgramme, {
          userId: 'test@test.com',
        }),
      ).toBeTruthy();
    });

    it('returns false when the user is not part of the delivery programme', () => {
      const deliveryProgramme: DeliveryProgramme = {
        arms_length_body_id: faker.string.uuid(),
        created_at: faker.date.recent(),
        delivery_programme_admins: [
          {
            aad_entity_ref_id: faker.string.uuid(),
            delivery_programme_id: faker.string.uuid(),
            email: 'test123@test.com',
            id: faker.string.uuid(),
            name: 'Test User',
            updated_at: faker.date.recent(),
            user_entity_ref: 'test123@test.com',
          },
        ],
        delivery_programme_code: 'ABC',
        description: 'Test programme',
        id: faker.string.uuid(),
        name: 'Test Project',
        title: 'Test Project',
        updated_at: faker.date.recent(),
      };

      expect(
        isDeliveryProgrammeAdmin.apply(deliveryProgramme, {
          userId: 'test@test.com',
        }),
      ).toBeFalsy();
    });

    it('returns false when the programme does not have any users configured', () => {
      const deliveryProgramme: DeliveryProgramme = {
        arms_length_body_id: faker.string.uuid(),
        created_at: faker.date.recent(),
        delivery_programme_admins: [],
        delivery_programme_code: 'ABC',
        description: 'Test programme',
        id: faker.string.uuid(),
        name: 'Test Project',
        title: 'Test Project',
        updated_at: faker.date.recent(),
      };

      expect(
        isDeliveryProgrammeAdmin.apply(deliveryProgramme, {
          userId: 'test@test.com',
        }),
      ).toBeFalsy();
    });
  });
});
