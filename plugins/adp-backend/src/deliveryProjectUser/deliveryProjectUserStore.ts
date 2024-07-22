import type { Knex } from 'knex';
import type { DeliveryProjectUser } from '@internal/plugin-adp-common';
import type { delivery_project_user } from './delivery_project_user';
import { delivery_project_user_name } from './delivery_project_user';
import {
  type SafeResult,
  type AddDeliveryProjectUser,
  type UpdateDeliveryProjectUser,
  assertUUID,
  checkMany,
  containsAnyValue,
  isUUID,
} from '../utils';
import type { delivery_project } from '../deliveryProject/delivery_project';
import { delivery_project_name } from '../deliveryProject/delivery_project';
import { NotFoundError } from '@backstage/errors';
import { type UUID } from 'node:crypto';
import {
  coreServices,
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';

export type IDeliveryProjectUserStore = {
  [P in keyof DeliveryProjectUserStore]: DeliveryProjectUserStore[P];
};

const allColumns = [
  'id',
  'delivery_project_id',
  'is_technical',
  'is_admin',
  'aad_entity_ref_id',
  'aad_user_principal_name',
  'name',
  'email',
  'github_username',
  'updated_at',
  'user_entity_ref',
] as const satisfies ReadonlyArray<keyof delivery_project_user>;

export class DeliveryProjectUserStore {
  readonly #client: Knex;

  constructor(client: Knex) {
    this.#client = client;
  }

  get #table() {
    return this.#client<delivery_project_user>(delivery_project_user_name);
  }

  async getAll(): Promise<DeliveryProjectUser[]> {
    const deliveryProjectUsers = await this.#table
      .select(...allColumns)
      .orderBy('delivery_project_id');

    return deliveryProjectUsers.map(row => this.#normalize(row));
  }

  async get(id: string): Promise<DeliveryProjectUser> {
    if (!isUUID(id)) throw notFound();
    const result = await this.#table
      .where('id', id)
      .select(...allColumns)
      .first();

    if (result === undefined) throw notFound();

    return this.#normalize(result);
  }

  async getByDeliveryProject(
    deliveryProjectId: string,
  ): Promise<DeliveryProjectUser[]> {
    const deliveryProjectUsers = await this.#table
      .where('delivery_project_id', deliveryProjectId)
      .select(...allColumns);

    return deliveryProjectUsers.map(row => this.#normalize(row));
  }

  async add(
    projectUser: AddDeliveryProjectUser,
  ): Promise<
    SafeResult<DeliveryProjectUser, 'duplicateUser' | 'unknownDeliveryProject'>
  > {
    const {
      aad_entity_ref_id,
      delivery_project_id,
      email,
      is_admin,
      is_technical,
      name,
      github_username,
      aad_user_principal_name,
      user_entity_ref,
    } = projectUser;

    const valid = await checkMany({
      duplicateUser: this.#deliveryProjectUserExists(
        aad_entity_ref_id,
        delivery_project_id,
      ),
      unknownDeliveryProject: not(
        this.#deliveryProjectExists(delivery_project_id),
      ),
    });

    if (!valid.success) return valid;

    assertUUID(delivery_project_id);

    const insertResult = await this.#table.insert(
      {
        delivery_project_id,
        is_technical,
        is_admin,
        aad_entity_ref_id,
        name,
        email,
        github_username,
        aad_user_principal_name,
        user_entity_ref,
      },
      allColumns,
    );

    if (insertResult.length < 1) {
      return { success: false, errors: ['unknown'] };
    }

    return {
      success: true,
      value: this.#normalize({ ...insertResult[0] }),
    };
  }

  async update(
    request: UpdateDeliveryProjectUser,
  ): Promise<SafeResult<DeliveryProjectUser, never>> {
    const { id, is_admin, is_technical, github_username } = request;

    if (!containsAnyValue(request))
      return { success: true, value: await this.get(id) };

    if (!isUUID(id)) throw notFound();

    const result = await this.#table.where('id', id).update(
      {
        is_admin,
        is_technical,
        github_username,
        updated_at: new Date(),
      },
      allColumns,
    );

    if (result.length < 1) return { success: false, errors: ['unknown'] };

    return {
      success: true,
      value: this.#normalize({
        ...result[0],
      }),
    };
  }

  async delete(id: string): Promise<boolean> {
    if (!isUUID(id) || !(await this.#exists(id))) throw notFound();

    const deleteResult = await this.#table.where('id', id).del();

    return deleteResult > 0;
  }

  #normalize(row: delivery_project_user): DeliveryProjectUser {
    return {
      ...row,
      is_admin:
        typeof row.is_admin === 'number' ? row.is_admin === 1 : row.is_admin,
      is_technical:
        typeof row.is_technical === 'number'
          ? row.is_technical === 1
          : row.is_technical,
      github_username: row.github_username ?? undefined,
    };
  }

  async #deliveryProjectExists(id: string) {
    if (!isUUID(id)) return false;
    const [{ count }] = await this.#client<delivery_project>(
      delivery_project_name,
    )
      .where('id', id)
      .limit(1)
      .count('*', { as: 'count' });
    return Number(count) > 0;
  }

  async #exists(id: UUID) {
    const [{ count }] = await this.#table
      .where('id', id)
      .limit(1)
      .count('*', { as: 'count' });
    return Number(count) > 0;
  }

  async #deliveryProjectUserExists(
    aadEntityRefId: string,
    deliveryProjectId: string,
  ) {
    if (!isUUID(deliveryProjectId)) return false;
    const [{ count }] = await this.#client<delivery_project_user>(
      delivery_project_user_name,
    )
      .where({
        aad_entity_ref_id: aadEntityRefId,
        delivery_project_id: deliveryProjectId,
      })
      .limit(1)
      .count('*', { as: 'count' });
    return Number(count) > 0;
  }
}

function notFound() {
  return new NotFoundError('Unknown Delivery Project User');
}

async function not(value: Promise<boolean>) {
  return !(await value);
}

export const deliveryProjectUserStoreRef =
  createServiceRef<IDeliveryProjectUserStore>({
    id: 'adp.deliveryprojectuserstore',
    scope: 'plugin',
    defaultFactory(service) {
      return Promise.resolve(
        createServiceFactory({
          service,
          deps: {
            database: coreServices.database,
          },
          async factory({ database }) {
            return new DeliveryProjectUserStore(await database.getClient());
          },
        }),
      );
    },
  });
