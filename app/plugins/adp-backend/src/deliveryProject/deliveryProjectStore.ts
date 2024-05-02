import { Knex } from 'knex';
import { NotFoundError } from '@backstage/errors';
import {
  CreateDeliveryProjectRequest,
  DeliveryProject,
  UpdateDeliveryProjectRequest,
} from '@internal/plugin-adp-common';
import { createName } from '../utils/index';
import {
  SafeResult,
  UUID,
  checkMany,
  containsAnyValue,
  emptyUUID,
  isUUID,
} from '../service/util';

type Row = {
  id: string;
  title: string;
  name: string;
  alias: string | null;
  description: string;
  finance_code: string | null;
  delivery_programme_id: string;
  delivery_project_code: string;
  namespace: string;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
  ado_project: string;
  team_type: string;
  service_owner: string;
  github_team_visibility: 'public' | 'private' | null;
};

const allColumns = [
  'id',
  'title',
  'name',
  'alias',
  'description',
  'finance_code',
  'delivery_programme_id',
  'delivery_project_code',
  'namespace',
  'ado_project',
  'created_at',
  'updated_at',
  'updated_by',
  'team_type',
  'service_owner',
  'github_team_visibility',
] as const satisfies Array<keyof Row>;

export type PartialDeliveryProject = Partial<DeliveryProject>;
export type IDeliveryProjectStore = {
  [P in keyof DeliveryProjectStore]: DeliveryProjectStore[P];
};

export class DeliveryProjectStore {
  readonly #client: Knex<any, any[]>;

  constructor(client: Knex) {
    this.#client = client;
  }

  get #table() {
    return this.#client<Row>('delivery_project');
  }

  async getAll(): Promise<DeliveryProject[]> {
    const result = await this.#table
      .select(...allColumns)
      .orderBy('created_at');

    return result.map(r => this.#normalize(r));
  }

  async get(id: string): Promise<DeliveryProject> {
    if (!isUUID(id)) throw notFound();
    const result = await this.#table
      .where('id', id)
      .select(...allColumns)
      .first();

    if (result === undefined) throw notFound();

    return this.#normalize(result);
  }

  async getByName(name: string): Promise<DeliveryProject> {
    const result = await this.#table
      .where('name', name)
      .select(...allColumns)
      .first();

    if (result === undefined) throw notFound();

    return this.#normalize(result);
  }

  async add(
    request: CreateDeliveryProjectRequest,
    author: string,
  ): Promise<
    SafeResult<
      DeliveryProject,
      | 'duplicateTitle'
      | 'duplicateName'
      | 'duplicateProjectCode'
      | 'unknownDeliveryProgramme'
    >
  > {
    const {
      ado_project,
      delivery_programme_id,
      delivery_project_code,
      description,
      github_team_visibility,
      service_owner,
      team_type,
      title,
      alias,
      finance_code,
    } = request;
    const programmeCode =
      (await this.#getDeliveryProgrammeCode(delivery_programme_id)) ??
      'UNKNOWN-DELIVERY-PROGRAMME';

    const name = createName(`${programmeCode}-${title}`);
    await checkMany({
      unknownDeliveryProgramme: not(
        this.#deliveryProgrammeExists(delivery_programme_id),
      ),
      duplicateTitle: this.#titleExists(
        title,
        delivery_programme_id,
        emptyUUID,
      ),
      duplicateName: this.#nameExists(name),
      duplicateProjectCode: this.#projectCodeExists(
        delivery_project_code,
        delivery_programme_id,
        emptyUUID,
      ),
    });
    const result = await this.#table.insert(
      {
        title,
        name,
        alias,
        description,
        finance_code,
        delivery_programme_id,
        delivery_project_code,
        namespace: `${programmeCode}-${delivery_project_code}`,
        ado_project,
        updated_by: author,
        team_type,
        service_owner,
        github_team_visibility,
      },
      allColumns,
    );

    if (result.length < 1) return { success: false, errors: ['unknown'] };

    return { success: true, value: this.#normalize(result[0]) };
  }

  async update(
    request: UpdateDeliveryProjectRequest,
    updatedBy: string,
  ): Promise<
    SafeResult<
      DeliveryProject,
      'duplicateTitle' | 'duplicateProjectCode' | 'unknownDeliveryProgramme'
    >
  > {
    const {
      id,
      ado_project,
      delivery_programme_id,
      delivery_project_code,
      description,
      github_team_visibility,
      service_owner,
      team_type,
      title,
      alias,
      finance_code,
    } = request;
    if (!containsAnyValue(request))
      return { success: true, value: await this.get(id) };
    if (!isUUID(id)) throw notFound();
    const programmeId =
      delivery_programme_id ?? (await this.#getDeliveryProgrammeId(id));
    await checkMany({
      unknownDeliveryProgramme:
        delivery_programme_id !== undefined &&
        not(this.#deliveryProgrammeExists(delivery_programme_id)),
      duplicateTitle:
        title !== undefined && this.#titleExists(title, programmeId, id),
      duplicateProjectCode:
        delivery_project_code !== undefined &&
        this.#projectCodeExists(delivery_project_code, programmeId, id),
    });

    const result = await this.#table.where('id', id).update(
      {
        title,
        alias,
        description,
        finance_code,
        delivery_programme_id,
        delivery_project_code,
        ado_project,
        updated_by: updatedBy,
        updated_at: new Date(),
        team_type,
        service_owner,
        github_team_visibility,
      },
      allColumns,
    );

    if (result.length < 1) return { success: false, errors: ['unknown'] };

    return { success: true, value: this.#normalize(result[0]) };
  }

  async #getDeliveryProgrammeId(id: UUID) {
    const result = await this.#table
      .where('id', id)
      .select('delivery_programme_id')
      .first();

    if (result === undefined) throw notFound();

    return result.delivery_programme_id;
  }

  #normalize(row: Row): DeliveryProject {
    return {
      ...row,
      alias: row.alias ?? undefined,
      finance_code: row.finance_code ?? undefined,
      github_team_visibility: row.github_team_visibility ?? undefined,
      updated_by: row.updated_by ?? undefined,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at ? row.updated_at : row.created_at),
    };
  }

  async #getDeliveryProgrammeCode(programmeId: string) {
    if (!isUUID(programmeId)) return null;
    const result = await this.#client<{
      id: string;
      delivery_programme_code: string;
    }>('delivery_programme')
      .where('id', programmeId)
      .select('delivery_programme_code')
      .first();
    return result?.delivery_programme_code ?? null;
  }

  async #titleExists(title: string, programmeId: string, ignoreId: UUID) {
    if (!isUUID(programmeId)) return false;
    const [{ count }] = await this.#table
      .where('title', title)
      .andWhere('delivery_programme_id', programmeId)
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

  async #deliveryProgrammeExists(id: string) {
    if (!isUUID(id)) return false;
    const [{ count }] = await this.#client('arms_length_body')
      .where('id', id)
      .limit(1)
      .count('*', { as: 'count' });
    return Number(count) > 0;
  }

  async #projectCodeExists(code: string, programmeId: string, ignoreId: UUID) {
    if (!isUUID(programmeId)) return false;
    const [{ count }] = await this.#table
      .where('delivery_programme_code', code)
      .andWhere('delivery_programme_id', programmeId)
      .andWhereNot('id', ignoreId)
      .limit(1)
      .count('*', { as: 'count' });
    return Number(count) > 0;
  }
}

function notFound() {
  return new NotFoundError('Unknown Delivery Project');
}

async function not(value: Promise<boolean>) {
  return !(await value);
}
