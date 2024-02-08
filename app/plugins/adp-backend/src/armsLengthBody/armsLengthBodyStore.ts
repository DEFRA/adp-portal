import { Knex } from 'knex';
import { NotFoundError } from '@backstage/errors';
import { ArmsLengthBody } from '../types';
import { createName } from '../utils';

const TABLE_NAME = 'arms_length_body';
type Row = {
  id: string;
  creator: string;
  owner: string;
  title: string;
  short_name?: string;
  description: string;
  url?: string;
  readonly name: string;
  created_at: Date;
  updated_by?: string;
  updated_at?: Date;
};

export type PartialArmsLengthBody = Partial<ArmsLengthBody>;

export class ArmsLengthBodyStore {
  constructor(private readonly client: Knex) {}
  async getAll(): Promise<ArmsLengthBody[]> {
    const ArmsLengthBodies = await this.client<Row>(TABLE_NAME)
      .select(
        'creator',
        'owner',
        'title',
        'short_name',
        'description',
        'url',
        'name',
        'id',
        'created_at',
      )
      .orderBy('created_at');

    return ArmsLengthBodies.map(row => ({
      creator: row.creator,
      owner: row.owner,
      title: row.title,
      short_name: row?.short_name,
      description: row.description,
      url: row?.url,
      name: row.name,
      id: row.id,
      timestamp: new Date(row.created_at),
    }));
  }

  async get(id: string): Promise<ArmsLengthBody | null> {
    const row = await this.client<Row>(TABLE_NAME)
      .where('id', id)
      .select(
        'creator',
        'owner',
        'title',
        'short_name',
        'description',
        'url',
        'name',
        'id',
        'created_at',
      )
      .first();

    return row
      ? {
          creator: row.creator,
          owner: row.owner,
          title: row.title,
          short_name: row?.short_name,
          description: row.description,
          url: row?.url,
          name: row.name,
          id: row.id,
          timestamp: new Date(row.created_at),
        }
      : null;
  }

  async add(
    armsLengthBody: Omit<ArmsLengthBody, 'id' | 'timestamp'>,
    creator: string,
    owner: string,
  ): Promise<ArmsLengthBody> {
    const insertResult = await this.client<Row>(TABLE_NAME).insert(
      {
        creator: creator,
        owner: owner,
        title: armsLengthBody.title,
        short_name: armsLengthBody?.short_name,
        description: armsLengthBody.description,
        url: armsLengthBody?.url,
        name: createName(armsLengthBody.title),
        updated_by: creator,
      },
      ['id', 'created_at'],
    );

    if (insertResult.length < 1) {
      throw new Error(
        `Could not insert Arms Length Body ${armsLengthBody.title}`,
      );
    }

    return {
      ...armsLengthBody,
      id: insertResult[0].id,
      timestamp: new Date(insertResult[0].created_at),
    };
  }

  async update(
    armsLengthBody: Omit<PartialArmsLengthBody, 'timestamp'>,
    updatedBy: string,
  ): Promise<ArmsLengthBody> {
    if (armsLengthBody.id === undefined) {
      throw new NotFoundError(
        `Could not find Arms Length Body with ID ${armsLengthBody.id}`,
      );
    }

    const existingALB = await this.get(armsLengthBody.id);

    if (!existingALB) {
      throw new NotFoundError(
        `Could not find Arms Length Body with ID ${armsLengthBody.id}`,
      );
    }

    const updated = new Date();

    const updatedData: Partial<ArmsLengthBody> = {};
    if (armsLengthBody.title !== undefined) {
      updatedData.title = armsLengthBody.title;
    }
    if (armsLengthBody.short_name !== undefined) {
      updatedData.short_name = armsLengthBody.short_name;
    }
    if (armsLengthBody.description !== undefined) {
      updatedData.description = armsLengthBody.description;
    }
    if (armsLengthBody.url !== undefined) {
      updatedData.url = armsLengthBody.url;
    }
    if (Object.keys(updatedData).length === 0) {
      return existingALB;
    }

    await this.client<Row>(TABLE_NAME)
      .where('id', armsLengthBody.id)
      .update({
        ...updatedData,
        updated_at: updated,
        updated_by: updatedBy,
      });

    return { ...existingALB, ...updatedData, timestamp: updated };
  }
}
