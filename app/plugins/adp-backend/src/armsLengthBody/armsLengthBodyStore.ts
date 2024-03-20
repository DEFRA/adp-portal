import { Knex } from 'knex';
import { NotFoundError } from '@backstage/errors';
import { ArmsLengthBody } from '@internal/plugin-adp-common';
import { createName } from '../utils';

const TABLE_NAME = 'arms_length_body';
type Row = {
  id: string;
  creator: string;
  owner: string;
  title: string;
  alias?: string;
  description: string;
  url?: string;
  readonly name: string;
  created_at: Date;
  updated_by?: string;
  updated_at: Date;
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
        'alias',
        'description',
        'url',
        'name',
        'id',
        'created_at',
        'updated_at',
      )
      .orderBy('created_at');
 
    return ArmsLengthBodies.map(row => ({
      creator: row.creator,
      owner: row.owner,
      title: row.title,
      alias: row?.alias,
      description: row.description,
      url: row?.url,
      name: row.name,
      id: row.id,
      created_at: new Date(row.created_at),
      updated_at: row.updated_at,
    }));
  }
 
  async get(id: string): Promise<ArmsLengthBody | null> {
    const row = await this.client<Row>(TABLE_NAME)
      .where('id', id)
      .select(
        'creator',
        'owner',
        'title',
        'alias',
        'description',
        'url',
        'name',
        'id',
        'created_at',
        'updated_at',
      )
      .first();
 
    return row
      ? {
          creator: row.creator,
          owner: row.owner,
          title: row.title,
          alias: row?.alias,
          description: row.description,
          url: row?.url,
          name: row.name,
          id: row.id,
          created_at: new Date(row.created_at),
          updated_at: row.updated_at
        }
      : null;
  }
 
  async add(
    armsLengthBody: Omit<ArmsLengthBody, 'id' | 'created_at' | 'updated_at'>,
    creator: string,
    owner: string,
  ): Promise<ArmsLengthBody> {
    const insertResult = await this.client<Row>(TABLE_NAME).insert(
      {
        creator: creator,
        owner: owner,
        title: armsLengthBody.title,
        alias: armsLengthBody?.alias,
        description: armsLengthBody.description,
        url: armsLengthBody?.url,
        name: createName(armsLengthBody.title),
        updated_by: creator,
      },
      ['id', 'created_at', 'updated_at'],
    );
 
    if (insertResult.length < 1) {
      throw new Error(
        `Could not insert Arms Length Body ${armsLengthBody.title}`,
      );
    }
    
    return {
      ...armsLengthBody,
      id: insertResult[0].id,
      created_at: new Date(insertResult[0].created_at),
      updated_at: new Date(insertResult[0].updated_at),
    };
  }
 
  async update(
    armsLengthBody: Omit<PartialArmsLengthBody, 'updated_at'>,
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


    const updatedData: Partial<ArmsLengthBody> = { ...armsLengthBody };

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

    return { ...existingALB, ...updatedData, updated_at: updated };
  }
}
 