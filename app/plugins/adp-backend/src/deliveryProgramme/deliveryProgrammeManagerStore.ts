import { Knex } from 'knex';
import { ProgrammeManager } from '@internal/plugin-adp-common';

const TABLE_NAME = 'delivery_programme_pm';
type Row = {
  id: string;
  delivery_programme_id: string;
  aad_entity_ref_id: string;
  email: string;
  name: string;
};

export class ProgrammeManagerStore {
  constructor(private readonly client: Knex) {}
  async getAll(): Promise<ProgrammeManager[]> {
    const ProgrammeManagers = await this.client<Row>(TABLE_NAME)
      .select(
        'id',
        'delivery_programme_id',
        'aad_entity_ref_id',
        'email',
        'name',
      )
      .orderBy('delivery_programme_id');

    return ProgrammeManagers.map(row => ({
      id: row.id,
      delivery_programme_id: row.delivery_programme_id,
      aad_entity_ref_id: row.aad_entity_ref_id,
      email: row.email,
      name: row.name,
    }));
  }

  async get(delivery_programme_id: string): Promise<ProgrammeManager[]> {
    const ProgrammeManagers = await this.client<Row>(TABLE_NAME)
      .where('delivery_programme_id', delivery_programme_id)
      .select(
        'id',
        'delivery_programme_id',
        'aad_entity_ref_id',
        'email',
        'name',
      );

    return ProgrammeManagers.map(row => ({
      id: row.id,
      delivery_programme_id: row.delivery_programme_id,
      aad_entity_ref_id: row.aad_entity_ref_id,
      email: row.email,
      name: row.name,
    }));
  }

  async add(
    programmeManager: Omit<ProgrammeManager, 'id'>,
  ): Promise<ProgrammeManager> {
    const insertResult = await this.client<Row>(TABLE_NAME).insert(
      {
        delivery_programme_id: programmeManager.delivery_programme_id,
        aad_entity_ref_id: programmeManager.aad_entity_ref_id,
        email: programmeManager.email,
        name: programmeManager.name,
      },
      ['id'],
    );

    return {
      ...programmeManager,
      id: insertResult[0].id,
    };
  }

  async delete(entityRefId: string, deliveryProgrammeId: string) {
    const deleteResult = await this.client(TABLE_NAME)
      .where({
        aad_entity_ref_id: entityRefId,
        delivery_programme_id: deliveryProgrammeId,
      })
      .del();

    return deleteResult;
  }
}
