import { Knex } from 'knex';
import {
  ArmsLengthBody,
  CreateArmsLengthBodyRequest,
  UpdateArmsLengthBodyRequest,
} from '@internal/plugin-adp-common';
import { createName } from '../utils/index';
import { NotFoundError } from '@backstage/errors';
import {
  SafeResult,
  checkMany,
  containsAnyValue,
  emptyUUID,
  isUUID,
} from '../service/util';
import { type UUID } from 'node:crypto';
import { arms_length_body, arms_length_body_name } from './arms_length_body';

export type PartialArmsLengthBody = Partial<ArmsLengthBody>;

export type IArmsLengthBodyStore = {
  [P in keyof ArmsLengthBodyStore]: ArmsLengthBodyStore[P];
};

const allColumns = [
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
  'updated_by',
] as const satisfies ReadonlyArray<keyof arms_length_body>;

export class ArmsLengthBodyStore {
  readonly #client: Knex;
  constructor(client: Knex) {
    this.#client = client;
  }

  get #table() {
    return this.#client<arms_length_body>(arms_length_body_name);
  }

  async getAll(): Promise<ArmsLengthBody[]> {
    const result = await this.#table
      .select(...allColumns)
      .orderBy('created_at');

    return result.map(row => this.#normalize(row));
  }

  async get(id: string): Promise<ArmsLengthBody> {
    if (!isUUID(id)) throw notFound();
    const row = await this.#table
      .where('id', id)
      .select(...allColumns)
      .first();

    if (row === undefined) throw notFound();

    return this.#normalize(row);
  }

  async add(
    request: CreateArmsLengthBodyRequest,
    creator: string,
    owner: string,
  ): Promise<SafeResult<ArmsLengthBody, 'duplicateTitle' | 'duplicateName'>> {
    const { description, title, alias, url } = request;
    const name = createName(title);
    const valid = await checkMany({
      duplicateTitle: this.#titleExists(title, emptyUUID),
      duplicateName: this.#nameExists(name),
    });
    if (!valid.success) return valid;

    const result = await this.#table.insert(
      {
        creator: creator,
        owner: owner,
        title,
        alias,
        description,
        url,
        name,
        updated_by: creator,
      },
      allColumns,
    );

    if (result.length < 1) return { success: false, errors: ['unknown'] };

    return {
      success: true,
      value: this.#normalize(result[0]),
    };
  }

  async update(
    request: UpdateArmsLengthBodyRequest,
    updatedBy: string,
  ): Promise<SafeResult<ArmsLengthBody, 'duplicateTitle'>> {
    const { id, description, title, alias, url } = request;
    if (!containsAnyValue(request))
      return { success: true, value: await this.get(id) };
    if (!isUUID(id) || !(await this.#exists(id))) throw notFound();

    const valid = await checkMany({
      duplicateTitle: title !== undefined && this.#titleExists(title, id),
    });
    if (!valid.success) return valid;

    const result = await this.#table.where('id', id).update(
      {
        alias,
        description,
        title,
        url,
        updated_at: new Date(),
        updated_by: updatedBy,
      },
      allColumns,
    );

    if (result.length < 1) return { success: false, errors: ['unknown'] };

    return {
      success: true,
      value: this.#normalize(result[0]),
    };
  }

  #normalize(row: arms_length_body): ArmsLengthBody {
    return {
      ...row,
      alias: row.alias ?? undefined,
      url: row.url ?? undefined,
      updated_by: row.updated_by ?? undefined,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at ? row.updated_at : row.created_at),
    };
  }

  async #titleExists(title: string, ignoreId: UUID) {
    const [{ count }] = await this.#table
      .where('title', title)
      .andWhereNot('id', ignoreId)
      .limit(1)
      .count('*', { as: 'count' });
    return Number(count) > 0;
  }

  async #nameExists(name: string) {
    const [{ count }] = await this.#table
      .where('name', name)
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
}

function notFound() {
  return new NotFoundError('Unknown Arms Length Body');
}
