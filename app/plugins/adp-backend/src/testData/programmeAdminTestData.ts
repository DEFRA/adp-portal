import { faker } from '@faker-js/faker';
import type { delivery_programme_admin } from '../deliveryProgrammeAdmin/delivery_programme_admin';
import { assertUUID } from '../service/util';
import type { DeliveryProgrammeAdmin } from '@internal/plugin-adp-common';

export function createDeliveryProgrammeAdminEntity(
  deliveryProgrammeId: string,
): delivery_programme_admin {
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
  };
}

export function createDeliveryProgrammeAdmin(
  deliveryProgrammeId: string,
): DeliveryProgrammeAdmin {
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
  };
}
