import type { Knex } from 'knex';
import type { DeliveryProjectUser } from '@internal/plugin-adp-common';
import type { delivery_project_user } from './delivery_project_user';
import { delivery_project_user_name } from './delivery_project_user';
import type { SafeResult } from '../service/util';
import { assertUUID, checkMany, isUUID } from '../service/util';
import type { AddDeliveryProjectUser } from '../utils';
import type { delivery_project } from '../deliveryProject/delivery_project';
import { delivery_project_name } from '../deliveryProject/delivery_project';

export type IDeliveryProjectUserStore = {
  [P in keyof DeliveryProjectUserStore]: DeliveryProjectUserStore[P];
};

const allColumns = [
  'id',
  'delivery_project_id',
  'is_technical',
  'is_admin',
  'aad_entity_ref_id',
  'name',
  'email',
  'github_username',
  'updated_at',
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

  #normalize(row: delivery_project_user): DeliveryProjectUser {
    return {
      ...row,
      is_admin: row.is_admin === 1,
      is_technical: row.is_technical === 1,
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

async function not(value: Promise<boolean>) {
  return !(await value);
}
