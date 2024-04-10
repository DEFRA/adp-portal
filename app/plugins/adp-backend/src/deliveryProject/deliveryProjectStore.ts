import { Knex } from 'knex';
import { NotFoundError } from '@backstage/errors';
import { DeliveryProject } from '@internal/plugin-adp-common';
import { createName } from '../utils/index';

const TABLE_NAME = 'delivery_project';
type Row = {
  id: string;
  title: string;
  readonly name: string;
  alias?: string;
  description: string;
  finance_code?: string;
  delivery_programme_id: string;
  delivery_project_code: string;
  url?: string;
  updated_by?: string;
  created_at: Date;
  updated_at: Date;
  ado_project?: string;
};

export type PartialDeliveryProject = Partial<DeliveryProject>;

export class DeliveryProjectStore {
  constructor(private readonly client: Knex) {}
  async getAll(): Promise<DeliveryProject[]> {
    const DeliveryProjects = await this.client<Row>(TABLE_NAME)
      .select(
        'id',
        'title',
        'name',
        'alias',
        'description',
        'finance_code',
        'delivery_programme_id',
        'delivery_project_code',
        'url',
        'ado_project',
        'created_at',
        'updated_at',
        'updated_by',
      )
      .orderBy('created_at');

    return DeliveryProjects.map(row => ({
      id: row.id,
      name: row.name,
      title: row.title,
      alias: row?.alias,
      description: row.description,
      finance_code: row?.finance_code,
      delivery_programme_id: row.delivery_programme_id,
      delivery_project_code: row.delivery_project_code,
      url: row?.url,
      ado_project: row?.ado_project,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      updated_by: row?.updated_by,
    }));
  }

  async get(id: string): Promise<DeliveryProject | null> {
    const row = await this.client<Row>(TABLE_NAME)
      .where('id', id)
      .select(
        'id',
        'title',
        'name',
        'alias',
        'description',
        'finance_code',
        'delivery_programme_id',
        'delivery_project_code',
        'url',
        'ado_project',
        'created_at',
        'updated_at',
        'updated_by',
      )
      .first();

    return row
      ? {
          id: row.id,
          name: row.name,
          title: row.title,
          alias: row?.alias,
          description: row.description,
          finance_code: row?.finance_code,
          delivery_programme_id: row.delivery_programme_id,
          delivery_project_code: row.delivery_project_code,
          url: row?.url,
          ado_project: row?.ado_project,
          created_at: new Date(row.created_at),
          updated_at: new Date(row.updated_at),
          updated_by: row?.updated_by,
        }
      : null;
  }

  async add(
    DeliveryProject: Omit<
      DeliveryProject,
      'id' | 'created_at' | 'updated_at'
    >,
    author: string,
  ): Promise<DeliveryProject> {
    const insertResult = await this.client<Row>(TABLE_NAME).insert(
      {
        title: DeliveryProject.title,
        name: createName(DeliveryProject.title),
        alias: DeliveryProject?.alias,
        description: DeliveryProject.description,
        finance_code: DeliveryProject?.finance_code,
        delivery_programme_id: DeliveryProject.delivery_programme_id,
        delivery_project_code: DeliveryProject.delivery_project_code,
        url: DeliveryProject?.url,
        ado_project: DeliveryProject?.ado_project,
        updated_by: author,
      },
      ['id', 'created_at', 'updated_at', 'name'],
    );

    if (insertResult.length < 1) {
      throw new Error(
        `Could not insert Delivery Project ${DeliveryProject.title}`,
      );
    }

    return {
      ...DeliveryProject,
      id: insertResult[0].id,
      created_at: new Date(insertResult[0].created_at),
      updated_at: new Date(insertResult[0].updated_at),
      name: insertResult[0].name
    };
  }

  async update(
    DeliveryProject: Omit<PartialDeliveryProject, 'updated_at'>,
    updatedBy: string,
  ): Promise<DeliveryProject> {
    if (DeliveryProject.id === undefined) {
      throw new NotFoundError(
        `Could not find Delivery Project with ID ${DeliveryProject.id}`,
      );
    }

    const existingProject = await this.get(DeliveryProject.id);

    if (!existingProject) {
      throw new NotFoundError(
        `Could not find Delivery Project with ID ${DeliveryProject.id}`,
      );
    }
    const updated = new Date();
    const updatedData: Partial<DeliveryProject> = {
      ...DeliveryProject,
    };

    if (Object.keys(updatedData).length === 0) {
      return existingProject;
    }
    await this.client<Row>(TABLE_NAME)
      .where('id', DeliveryProject.id)
      .update({
        ...updatedData,
        updated_at: updated,
        updated_by: updatedBy,
      });

    return {
      ...existingProject,
      ...updatedData,
      updated_at: updated,
    };
  }
}
