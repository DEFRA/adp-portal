import type { Knex } from 'knex';
import type { DeliveryProjectUser } from '@internal/plugin-adp-common';

const TABLE_NAME = 'delivery_project_user';
type Row = {
  id: string;
  delivery_project_id: string;
  is_technical: boolean;
  is_admin: boolean;
  aad_entity_ref_id: string;
  name: string;
  email: string;
  github_username?: string;
};

export type IDeliveryProjectUserStore = {
  [P in keyof DeliveryProjectUserStore]: DeliveryProjectUserStore[P];
};

export class DeliveryProjectUserStore {
  constructor(private readonly client: Knex) {}
  async getAll(): Promise<DeliveryProjectUser[]> {
    const DeliveryProjectUsers = await this.client<Row>(TABLE_NAME)
      .select(
        'id',
        'delivery_project_id',
        'is_technical',
        'is_admin',
        'aad_entity_ref_id',
        'name',
        'email',
        'github_username',
      )
      .orderBy('delivery_project_id');

    return DeliveryProjectUsers.map(row => ({
      id: row.id,
      delivery_project_id: row.delivery_project_id,
      is_technical: row.is_technical,
      is_admin: row.is_admin,
      aad_entity_ref_id: row.aad_entity_ref_id,
      name: row.name,
      email: row.email,
      github_username: row.github_username,
    }));
  }

  async get(delivery_project_id: string): Promise<DeliveryProjectUser[]> {
    const DeliveryProjectUsers = await this.client<Row>(TABLE_NAME)
      .where('delivery_project_id', delivery_project_id)
      .select(
        'id',
        'delivery_project_id',
        'is_technical',
        'is_admin',
        'aad_entity_ref_id',
        'name',
        'email',
        'github_username',
      );

    return DeliveryProjectUsers.map(row => ({
      id: row.id,
      delivery_project_id: row.delivery_project_id,
      is_technical: row.is_technical,
      is_admin: row.is_admin,
      aad_entity_ref_id: row.aad_entity_ref_id,
      name: row.name,
      email: row.email,
      github_username: row.github_username,
    }));
  }

  async add(
    projectUser: Omit<DeliveryProjectUser, 'id'>,
  ): Promise<DeliveryProjectUser> {
    const insertResult = await this.client<Row>(TABLE_NAME).insert(
      {
        delivery_project_id: projectUser.delivery_project_id,
        is_technical: projectUser.is_technical,
        is_admin: projectUser.is_admin,
        aad_entity_ref_id: projectUser.aad_entity_ref_id,
        name: projectUser.name,
        email: projectUser.email,
        github_username: projectUser.github_username,
      },
      ['id'],
    );

    return {
      ...projectUser,
      id: insertResult[0].id,
    };
  }
}
