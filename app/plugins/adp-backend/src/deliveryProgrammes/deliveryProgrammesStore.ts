import { Knex } from 'knex';
import { NotFoundError } from '@backstage/errors';
import { DeliveryProgramme } from '../types';

const TABLE_NAME = 'delivery_programmes';
type Row = {
  id: string;
  name: string;
  arms_length_body: string;
  programme_code: number;
  description?: string;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by: string;
};

export class DeliveryProgrammesStore {
  constructor(private readonly client: Knex) {}

  async getAll(): Promise<DeliveryProgramme[]> {
    const deliveryProgrammes = await this.client<Row>(TABLE_NAME)
      .select(
        'id',
        'name',
        'arms_length_body',
        'description',
        'programme_code',
        'created_at',
      )
      .orderBy('created_at');

    return deliveryProgrammes.map(row => ({
      id: row.id,
      name: row.name,
      title: row.name,
      armsLengthBody: row.arms_length_body,
      deliveryProgrammeCode: row.programme_code,
      description: row.description,
      timestamp: new Date(row.created_at).getMilliseconds(),
    }));
  }

  async get(id: string): Promise<DeliveryProgramme | null> {
    const row = await this.client<Row>(TABLE_NAME)
      .where('id', id)
      .select(
        'id',
        'name',
        'arms_length_body',
        'description',
        'programme_code',
        'created_at',
      )
      .first();

    return row
      ? {
          id: row.id,
          name: row.name,
          title: row.name,
          armsLengthBody: row.arms_length_body,
          deliveryProgrammeCode: row.programme_code,
          description: row.description,
          timestamp: new Date(row.created_at).getMilliseconds(),
        }
      : null;
  }

  async add(
    deliveryProgramme: Omit<DeliveryProgramme, 'id' | 'timestamp'>,
    createdBy: string,
  ): Promise<DeliveryProgramme> {
    const insertResult = await this.client<Row>(TABLE_NAME).insert(
      {
        name: deliveryProgramme.name,
        arms_length_body: deliveryProgramme.armsLengthBody,
        description: deliveryProgramme.description,
        programme_code: deliveryProgramme.deliveryProgrammeCode,
        created_by: createdBy,
        updated_by: createdBy,
      },
      ['id', 'created_at'],
    );

    if (insertResult.length < 1) {
      throw new Error(
        `Could not insert delivery programme ${deliveryProgramme.name}`,
      );
    }

    return {
      ...deliveryProgramme,
      id: insertResult[0].id,
      timestamp: new Date(insertResult[0].created_at).getMilliseconds(),
    };
  }

  async update(
    deliveryProgramme: Omit<DeliveryProgramme, 'timestamp'>,
    updatedBy: string,
  ): Promise<DeliveryProgramme> {
    const existingProgramme = await this.get(deliveryProgramme.id);
    if (!existingProgramme) {
      throw new NotFoundError(
        `Could not find delivery programme with ID ${deliveryProgramme.id}`,
      );
    }

    const updated = new Date();
    await this.client<Row>(TABLE_NAME)
      .where('id', deliveryProgramme.id)
      .update({
        name: deliveryProgramme.name,
        arms_length_body: deliveryProgramme.armsLengthBody,
        description: deliveryProgramme.description,
        programme_code: deliveryProgramme.deliveryProgrammeCode,
        updated_at: updated,
        updated_by: updatedBy,
      });

    return { ...deliveryProgramme, timestamp: updated.getMilliseconds() };
  }
}
