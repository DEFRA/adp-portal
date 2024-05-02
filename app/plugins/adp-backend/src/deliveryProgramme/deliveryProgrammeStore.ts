import { Knex } from 'knex';
import { NotFoundError } from '@backstage/errors';
import {
  CreateDeliveryProgrammeRequest,
  DeliveryProgramme,
  DeliveryProgrammeAdmin,
  UpdateDeliveryProgrammeRequest,
} from '@internal/plugin-adp-common';
import { createName } from '../utils/index';
import {
  SafeResult,
  assertUUID,
  checkMany,
  containsAnyValue,
  emptyUUID,
  isUUID,
} from '../service/util';
import { type UUID } from 'node:crypto';
import {
  delivery_programme,
  delivery_programme_name,
} from './delivery_programme';
import {
  arms_length_body,
  arms_length_body_name,
} from '../armsLengthBody/arms_length_body';

export type PartialDeliveryProgramme = Partial<DeliveryProgramme>;
export type IDeliveryProgrammeStore = {
  [P in keyof DeliveryProgrammeStore]: DeliveryProgrammeStore[P];
};

const allColumns = [
  'id',
  'title',
  'name',
  'alias',
  'description',
  'arms_length_body_id',
  'delivery_programme_code',
  'url',
  'created_at',
  'updated_at',
  'updated_by',
] as const satisfies ReadonlyArray<keyof delivery_programme>;

export class DeliveryProgrammeStore {
  readonly #client: Knex;

  constructor(client: Knex) {
    this.#client = client;
  }

  get #table() {
    return this.#client<delivery_programme>(delivery_programme_name);
  }

  async getAll(): Promise<DeliveryProgramme[]> {
    const result = await this.#table
      .select(...allColumns)
      .orderBy('created_at');

    return result.map(r => this.#normalize(r));
  }

  async get(id: string): Promise<DeliveryProgramme> {
    if (!isUUID(id)) throw notFound();
    const result = await this.#table
      .where('id', id)
      .select(...allColumns)
      .first();

    if (result === undefined) throw notFound();

    return this.#normalize(result);
  }

  async add(
    request: CreateDeliveryProgrammeRequest,
    author: string,
  ): Promise<
    SafeResult<
      DeliveryProgramme,
      | 'unknownArmsLengthBody'
      | 'duplicateName'
      | 'duplicateTitle'
      | 'duplicateProgrammeCode'
    >
  > {
    const {
      arms_length_body_id,
      delivery_programme_code,
      description,
      title,
      alias,
      url,
    } = request;
    const name = createName(title);
    const valid = await checkMany({
      duplicateTitle: this.#titleExists(title, emptyUUID),
      duplicateName: this.#nameExists(name),
      unknownArmsLengthBody: not(
        this.#armsLengthBodyExists(arms_length_body_id),
      ),
      duplicateProgrammeCode: this.#programmeCodeExists(
        delivery_programme_code,
        emptyUUID,
      ),
    });
    if (!valid.success) return valid;

    assertUUID(arms_length_body_id);

    const result = await this.#table.insert(
      {
        title,
        name,
        alias,
        description,
        arms_length_body_id,
        delivery_programme_code,
        url,
        updated_by: author,
      },
      allColumns,
    );

    if (result.length < 1) return { success: false, errors: ['unknown'] };

    return { success: true, value: this.#normalize(result[0]) };
  }

  async update(
    request: UpdateDeliveryProgrammeRequest,
    updatedBy: string,
  ): Promise<
    SafeResult<
      DeliveryProgramme,
      'unknownArmsLengthBody' | 'duplicateTitle' | 'duplicateProgrammeCode'
    >
  > {
    const {
      id,
      arms_length_body_id,
      delivery_programme_code,
      description,
      title,
      alias,
      url,
    } = request;
    if (!containsAnyValue(request))
      return { success: true, value: await this.get(id) };
    if (!isUUID(id) || !(await this.#exists(id))) throw notFound();
    const valid = await checkMany({
      duplicateTitle: title !== undefined && this.#titleExists(title, id),
      unknownArmsLengthBody:
        arms_length_body_id !== undefined &&
        not(this.#armsLengthBodyExists(arms_length_body_id)),
      duplicateProgrammeCode:
        delivery_programme_code !== undefined &&
        this.#programmeCodeExists(delivery_programme_code, id),
    });
    if (!valid.success) return valid;

    if (arms_length_body_id !== undefined) assertUUID(arms_length_body_id);

    const result = await this.#table.where('id', id).update(
      {
        arms_length_body_id,
        delivery_programme_code,
        description,
        title,
        alias,
        url,
        updated_at: new Date(),
        updated_by: updatedBy,
      },
      allColumns,
    );

    if (result.length < 1) return { success: false, errors: ['unknown'] };

    return { success: true, value: this.#normalize(result[0]) };
  }

  #normalize(
    row: delivery_programme,
    programmeManagers: DeliveryProgrammeAdmin[] = [],
  ): DeliveryProgramme {
    return {
      ...row,
      alias: row.alias ?? undefined,
      url: row.url ?? undefined,
      updated_by: row.updated_by ?? undefined,
      programme_managers: programmeManagers,
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

  async #armsLengthBodyExists(id: string) {
    if (!isUUID(id)) return false;
    const [{ count }] = await this.#client<arms_length_body>(
      arms_length_body_name,
    )
      .where('id', id)
      .limit(1)
      .count('*', { as: 'count' });
    return Number(count) > 0;
  }

  async #programmeCodeExists(code: string, ignoreId: UUID) {
    const [{ count }] = await this.#table
      .where('delivery_programme_code', code)
      .andWhereNot('id', ignoreId)
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
  return new NotFoundError('Unknown Delivery Programme');
}

async function not(value: Promise<boolean>) {
  return !(await value);
}
