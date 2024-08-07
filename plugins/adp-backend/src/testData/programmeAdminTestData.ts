import { faker } from '@faker-js/faker';
import type { delivery_programme_admin } from '../deliveryProgrammeAdmin/delivery_programme_admin';
import { assertUUID } from '../utils';
import type { DeliveryProgrammeAdmin } from '@internal/plugin-adp-common';

export function createDeliveryProgrammeAdmin(deliveryProgrammeId: string) {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const entityId = faker.string.uuid();

  assertUUID(deliveryProgrammeId);
  assertUUID(entityId);

  return {
    aad_entity_ref_id: faker.string.uuid(),
    delivery_programme_id: deliveryProgrammeId,
    email: faker.internet.email({ firstName: firstName, lastName: lastName }),
    id: entityId,
    name: faker.person.fullName({ firstName: firstName, lastName: lastName }),
    updated_at: faker.date.past(),
  } satisfies DeliveryProgrammeAdmin satisfies delivery_programme_admin;
}

export const expectedProgrammeAdmin = {
  id: 'a9dc2414-0626-43d2-993d-a53aac4d73421',
  delivery_programme_id: '123',
  aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73421',
  email: 'test1.test@onmicrosoft.com',
  name: 'test 1',
  updated_at: new Date(),
};
