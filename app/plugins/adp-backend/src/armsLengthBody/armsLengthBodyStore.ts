import { Knex } from 'knex';
import { NotFoundError } from '@backstage/errors';
import { ArmsLengthBody } from '../types';

const TABLE_NAME = 'arms_length_bodies';
type Row = {
    creator_username: string;
    creator_email: string;
    owner_username: string;
    owner_email: string;
    name: string;
    short_name?: string;
    description?: string;
    id: string;
    created_at: Date;
    updated_at: Date;
    updated_by: string;
  };

export class ArmsLengthBodyStore {
  constructor(private readonly client: Knex) {}

  async getAll(): Promise<ArmsLengthBody[]> {
    const ArmsLengthBodies = await this.client<Row>(TABLE_NAME)
      .select(
        'creator_username',
        'creator_email',
        'owner_username',
        'owner_email',
        'name',
        'short_name',
        'description',
        'id',
        'created_at',
      )
      .orderBy('created_at');

    return ArmsLengthBodies.map(row => ({
      creator_username: row.creator_username,
      creator_email: row.creator_email,
      owner_username: row.owner_username,
      owner_email: row.owner_email,
      name: row.name,
      short_name: row?.short_name,
      description: row?.description,
      id: row.id,
      timestamp: new Date(row.created_at).getMilliseconds(),
    }));
  }

  async get(id: string): Promise<ArmsLengthBody | null> {
    const row = await this.client<Row>(TABLE_NAME)
      .where('id', id)
      .select(
        'creator_username',
        'creator_email',
        'owner_username',
        'owner_email',
        'name',
        'short_name',
        'description',
        'id',
        'created_at',
      )
      .first();

    return row
      ? {
        creator_username: row.creator_username,
        creator_email: row.creator_email,
        owner_username: row.owner_username,
        owner_email: row.owner_email,
        name: row.name,
        short_name: row.short_name,
        description: row.description,
        id: row.id,
        timestamp: new Date(row.created_at).getMilliseconds(),
        }
      : null;
  }

  async add(
    armsLengthBody: Omit<ArmsLengthBody, 'id' | 'timestamp'>,
    creator_username: string,
  ): Promise<ArmsLengthBody> {
    const insertResult = await this.client<Row>(TABLE_NAME).insert(
      {
        creator_username: armsLengthBody.creator_username,
        creator_email: armsLengthBody.creator_email,
        owner_username: armsLengthBody.owner_username,
        owner_email: armsLengthBody.owner_email,
        name: armsLengthBody.name,
        short_name: armsLengthBody.short_name,
        description: armsLengthBody.description,
        updated_by: creator_username,
      },
      ['id', 'created_at'],
    );

    if (insertResult.length < 1) {
      throw new Error(
        `Could not insert Arms Length Body ${armsLengthBody.name}`,
      );
    }

    return {
      ...armsLengthBody,
      id: insertResult[0].id,
      timestamp: new Date(insertResult[0].created_at).getMilliseconds(),
    };
  }

  async update(
    armsLengthBody: Omit<ArmsLengthBody, 'timestamp'>,
    updatedBy: string,
  ): Promise<ArmsLengthBody> {
    const existingALB = await this.get(armsLengthBody.id);
    if (!existingALB) {
      throw new NotFoundError(
        `Could not find Arms Length Body with ID ${armsLengthBody.id}`,
      );
    }

    const updated = new Date();
    await this.client<Row>(TABLE_NAME)
      .where('id', armsLengthBody.id)
      .update({
        creator_username: armsLengthBody.creator_username,
        creator_email: armsLengthBody.creator_email,
        owner_username: armsLengthBody.owner_username,
        owner_email: armsLengthBody.owner_email,
        name: armsLengthBody.name,
        short_name: armsLengthBody.short_name,
        description: armsLengthBody.description,
        updated_at: updated,
        updated_by: updatedBy,
      });

    return { ...armsLengthBody, timestamp: updated.getMilliseconds() };
  }
}