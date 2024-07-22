import type { Knex } from 'knex';
import { NotFoundError } from '@backstage/errors';
import {
  createName,
  type CreateDeliveryProjectRequest,
  type DeliveryProject,
  type UpdateDeliveryProjectRequest,
} from '@internal/plugin-adp-common';
import {
  type SafeResult,
  assertUUID,
  checkMany,
  containsAnyValue,
  emptyUUID,
  isUUID,
} from '../utils';
import { type UUID } from 'node:crypto';
import type { delivery_project } from './delivery_project';
import { delivery_project_name } from './delivery_project';
import type { delivery_programme } from '../deliveryProgramme/delivery_programme';
import { delivery_programme_name } from '../deliveryProgramme/delivery_programme';
import {
  coreServices,
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';

const allColumns = addTableName(delivery_project_name, [
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
] as const satisfies ReadonlyArray<keyof delivery_project>);

const programmeColumns = addTableName(delivery_programme_name, [
  'delivery_programme_code',
] as const satisfies ReadonlyArray<keyof delivery_programme>);

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
    return this.#client<delivery_project>(delivery_project_name);
  }

  get #tableWithProgrammes() {
    return this.#table.join<delivery_programme>(
      delivery_programme_name,
      `${delivery_programme_name}.id`,
      '=',
      `${delivery_project_name}.delivery_programme_id`,
    );
  }

  async getAll(): Promise<DeliveryProject[]> {
    const result = await this.#tableWithProgrammes
      .select(...allColumns, ...programmeColumns)
      .orderBy(`${delivery_project_name}.created_at`);

    return result.map(r => this.#normalize(r));
  }

  async get(id: string): Promise<DeliveryProject> {
    if (!isUUID(id)) throw notFound();
    const result = await this.#tableWithProgrammes
      .where(`${delivery_project_name}.id`, id)
      .select(...allColumns, ...programmeColumns)
      .first();

    if (result === undefined) throw notFound();

    return this.#normalize(result);
  }

  async getByName(name: string): Promise<DeliveryProject> {
    const result = await this.#tableWithProgrammes
      .where(`${delivery_project_name}.name`, name)
      .select(...allColumns, ...programmeColumns)
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
      'duplicateTitle' | 'duplicateName' | 'unknownDeliveryProgramme'
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
    const valid = await checkMany({
      unknownDeliveryProgramme: not(
        this.#deliveryProgrammeExists(delivery_programme_id),
      ),
      duplicateTitle: this.#titleExists(
        title,
        delivery_programme_id,
        emptyUUID,
      ),
      duplicateName: this.#nameExists(name),
    });
    if (!valid.success) return valid;

    assertUUID(delivery_programme_id);

    const result = await this.#table.insert(
      {
        title,
        name,
        alias,
        description,
        finance_code,
        delivery_programme_id,
        delivery_project_code,
        namespace: name,
        ado_project,
        updated_by: author,
        team_type,
        service_owner,
        github_team_visibility,
      },
      allColumns,
    );

    if (result.length < 1) return { success: false, errors: ['unknown'] };

    return {
      success: true,
      value: this.#normalize({
        ...result[0],
        delivery_programme_code: programmeCode,
      }),
    };
  }

  async update(
    request: UpdateDeliveryProjectRequest,
    updatedBy: string,
  ): Promise<
    SafeResult<DeliveryProject, 'duplicateTitle' | 'unknownDeliveryProgramme'>
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
    const valid = await checkMany({
      unknownDeliveryProgramme:
        delivery_programme_id !== undefined &&
        not(this.#deliveryProgrammeExists(delivery_programme_id)),
      duplicateTitle:
        title !== undefined && this.#titleExists(title, programmeId, id),
    });
    if (!valid.success) return valid;

    if (delivery_programme_id !== undefined) assertUUID(delivery_programme_id);

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

    const programmeCode =
      (await this.#getDeliveryProgrammeCode(result[0].delivery_programme_id)) ??
      '';

    return {
      success: true,
      value: this.#normalize({
        ...result[0],
        delivery_programme_code: programmeCode,
      }),
    };
  }

  async #getDeliveryProgrammeId(id: UUID) {
    const result = await this.#table
      .where('id', id)
      .select('delivery_programme_id')
      .first();

    if (result === undefined) throw notFound();

    return result.delivery_programme_id;
  }

  #normalize(
    row: delivery_project & Pick<delivery_programme, 'delivery_programme_code'>,
  ): DeliveryProject {
    return {
      ...row,
      alias: row.alias ?? undefined,
      finance_code: row.finance_code ?? undefined,
      github_team_visibility: row.github_team_visibility ?? undefined,
      updated_by: row.updated_by ?? undefined,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at ? row.updated_at : row.created_at),
      delivery_project_users: [],
      delivery_programme_admins: [],
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
    const [{ count }] = await this.#client<delivery_programme>(
      delivery_programme_name,
    )
      .where('id', id)
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

function addTableName<T extends readonly string[]>(
  tableName: string,
  columns: T,
) {
  // Fake return as T because knex typing cant deal with the table name prefix
  return columns.map(c => `${tableName}.${c}`) as unknown as T;
}

export const deliveryProjectStoreRef = createServiceRef<IDeliveryProjectStore>({
  id: 'adp.deliveryprojectstore',
  scope: 'plugin',
  defaultFactory(service) {
    return Promise.resolve(
      createServiceFactory({
        service,
        deps: {
          database: coreServices.database,
        },
        async factory({ database }) {
          return new DeliveryProjectStore(await database.getClient());
        },
      }),
    );
  },
});
