import type { Knex } from 'knex';
import type { DeliveryProjectUser } from '@internal/plugin-adp-common';
import type { delivery_project_user } from './delivery_project_user';
import { delivery_project_user_name } from './delivery_project_user';
import { assertUUID } from '../service/util';

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
    projectUser: Omit<DeliveryProjectUser, 'id'>,
  ): Promise<DeliveryProjectUser> {
    const {
      aad_entity_ref_id,
      delivery_project_id,
      email,
      is_admin,
      is_technical,
      name,
      github_username,
    } = projectUser;

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

    return this.#normalize(insertResult[0]);
  }

  #normalize(row: delivery_project_user): DeliveryProjectUser {
    return {
      ...row,
      is_admin: row.is_admin === 1,
      is_technical: row.is_technical === 1,
      github_username: row.github_username ?? undefined,
    };
  }
}
