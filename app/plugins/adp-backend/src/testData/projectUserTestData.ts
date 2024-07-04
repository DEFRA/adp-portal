import { faker } from '@faker-js/faker';
import { assertUUID } from '../utils';
import type { delivery_project_user } from '../deliveryProjectUser/delivery_project_user';
import type { DeliveryProjectUser } from '@internal/plugin-adp-common';

export function createDeliveryProjectUserEntity(
  deliveryProjectId: string,
): delivery_project_user {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const entityId = faker.string.uuid();

  assertUUID(deliveryProjectId);
  assertUUID(entityId);

  return {
    aad_entity_ref_id: faker.string.uuid(),
    delivery_project_id: deliveryProjectId,
    email: faker.internet.email({ firstName: firstName, lastName: lastName }),
    github_username: faker.internet.userName({
      firstName: firstName,
      lastName: lastName,
    }),
    is_admin: faker.datatype.boolean(),
    is_technical: faker.datatype.boolean(),
    name: faker.person.fullName({ firstName: firstName, lastName: lastName }),
    id: entityId,
    updated_at: faker.date.past(),
  };
}

export function createDeliveryProjectUser(
  deliveryProjectId: string,
): DeliveryProjectUser {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const entityId = faker.string.uuid();

  assertUUID(deliveryProjectId);
  assertUUID(entityId);

  return {
    aad_entity_ref_id: faker.string.uuid(),
    delivery_project_id: deliveryProjectId,
    email: faker.internet.email({ firstName: firstName, lastName: lastName }),
    github_username: faker.internet.userName({
      firstName: firstName,
      lastName: lastName,
    }),
    is_admin: faker.datatype.boolean(),
    is_technical: faker.datatype.boolean(),
    name: faker.person.fullName({ firstName: firstName, lastName: lastName }),
    id: entityId,
    updated_at: faker.date.past(),
    aad_user_principal_name: faker.internet.email({
      firstName: firstName,
      lastName: lastName,
    }),
  };
}
