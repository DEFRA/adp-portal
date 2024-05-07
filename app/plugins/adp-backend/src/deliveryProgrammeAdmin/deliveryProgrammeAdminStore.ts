import { Knex } from 'knex';
import { DeliveryProgrammeAdmin } from '@internal/plugin-adp-common';
import { CreateDeliveryProgrammeAdmin } from '../utils';
import { delivery_programme_admin } from './delivery_programme_admin';
import { assertUUID } from '../service/util';

const TABLE_NAME = 'delivery_programme_admin';
export type IDeliveryProgrammeAdminStore = {
  [P in keyof DeliveryProgrammeAdminStore]: DeliveryProgrammeAdminStore[P];
};

export class DeliveryProgrammeAdminStore {
  constructor(private readonly client: Knex) {}

  /**
   * Gets all Delivery Programme Admins from the database.
   * @returns a collection of DeliveryProgrammeAdmin.
   */
  async getAll(): Promise<DeliveryProgrammeAdmin[]> {
    const deliveryProgrammeAdmins = await this.client<delivery_programme_admin>(
      TABLE_NAME,
    )
      .select(
        'id',
        'delivery_programme_id',
        'aad_entity_ref_id',
        'email',
        'name',
        'updated_at',
      )
      .orderBy('delivery_programme_id');

    return deliveryProgrammeAdmins.map(row => ({
      id: row.id,
      delivery_programme_id: row.delivery_programme_id,
      aad_entity_ref_id: row.aad_entity_ref_id,
      email: row.email,
      name: row.name,
      updated_at: row.updated_at,
    }));
  }

  /**
   * Gets all Delivery Programme Admins associated with a Delivery Programme.
   * @param delivery_programme_id ID of the delivery programme to query on.
   * @returns a collection of DeliveryProgrammeAdmin associated with the delivery programme.
   */
  async getByDeliveryProgramme(
    delivery_programme_id: string,
  ): Promise<DeliveryProgrammeAdmin[]> {
    const deliveryProgrammeAdmins = await this.client<delivery_programme_admin>(
      TABLE_NAME,
    )
      .where('delivery_programme_id', delivery_programme_id)
      .select(
        'id',
        'delivery_programme_id',
        'aad_entity_ref_id',
        'email',
        'name',
        'updated_at',
      )
      .orderBy('name', 'asc');

    return deliveryProgrammeAdmins.map(row => ({
      id: row.id,
      delivery_programme_id: row.delivery_programme_id,
      aad_entity_ref_id: row.aad_entity_ref_id,
      email: row.email,
      name: row.name,
      updated_at: row.updated_at,
    }));
  }

  /**
   * Gets a Delivery Programme Admin matching the Entra ID object ID and delivery programme ID.
   * @param aadEntityRefId The Entra ID object ID associated with the user
   * @param deliveryProgrammeId The Delivery Programme ID associated with the user.
   * @returns A DeliveryProgrammeAdmin matching the aadEntityRefId and deliveryProgrammeId, or undefined if not found.
   */
  async getByAADEntityRef(
    aadEntityRefId: string,
    deliveryProgrammeId: string,
  ): Promise<DeliveryProgrammeAdmin | undefined> {
    const deliveryProgrammeAdmin = await this.client<delivery_programme_admin>(
      TABLE_NAME,
    )
      .where('delivery_programme_id', deliveryProgrammeId)
      .andWhere('aad_entity_ref_id', aadEntityRefId)
      .first(
        'id',
        'delivery_programme_id',
        'aad_entity_ref_id',
        'email',
        'name',
        'updated_at',
      );

    return deliveryProgrammeAdmin !== undefined
      ? {
          id: deliveryProgrammeAdmin.id,
          delivery_programme_id: deliveryProgrammeAdmin.delivery_programme_id,
          aad_entity_ref_id: deliveryProgrammeAdmin.aad_entity_ref_id,
          email: deliveryProgrammeAdmin.email,
          name: deliveryProgrammeAdmin.name,
          updated_at: deliveryProgrammeAdmin.updated_at,
        }
      : undefined;
  }

  /**
   * Adds a Delivery Programme Admin to the database.
   * @param deliveryProgrammeAdmin the delivery programme admin to add.
   * @returns A DeliveryProgrammeAdmin with values generated by the database.
   */
  async add(
    deliveryProgrammeAdmin: CreateDeliveryProgrammeAdmin,
  ): Promise<DeliveryProgrammeAdmin> {
    assertUUID(deliveryProgrammeAdmin.delivery_programme_id);
    const insertResult = await this.client<delivery_programme_admin>(
      TABLE_NAME,
    ).insert(
      {
        delivery_programme_id: deliveryProgrammeAdmin.delivery_programme_id,
        aad_entity_ref_id: deliveryProgrammeAdmin.aad_entity_ref_id,
        email: deliveryProgrammeAdmin.email,
        name: deliveryProgrammeAdmin.name,
      },
      ['id', 'updated_at'],
    );

    return {
      ...deliveryProgrammeAdmin,
      id: insertResult[0].id,
      updated_at: insertResult[0].updated_at,
    };
  }

  /**
   * Bulk adds Delivery Programme Admins to the database.
   * @param deliveryProgrammeAdmins The Delivery Programme Admins to add.
   * @returns A collection of DeliveryProgrammeAdmin with values generated by the database.
   */
  async addMany(
    deliveryProgrammeAdmins: CreateDeliveryProgrammeAdmin[],
  ): Promise<DeliveryProgrammeAdmin[]> {
    const insertResult = await this.client<delivery_programme_admin>(
      TABLE_NAME,
    ).insert(
      deliveryProgrammeAdmins.map(a => {
        const { delivery_programme_id } = a;
        assertUUID(delivery_programme_id);
        return { ...a, delivery_programme_id };
      }),
      [
        'id',
        'delivery_programme_id',
        'aad_entity_ref_id',
        'email',
        'name',
        'updated_at',
      ],
    );

    return insertResult.map(row => ({
      id: row.id,
      delivery_programme_id: row.delivery_programme_id,
      aad_entity_ref_id: row.aad_entity_ref_id,
      email: row.email,
      name: row.name,
      updated_at: row.updated_at,
    }));
  }

  /**
   * Deletes a Delivery Programme Admin from the database.
   * @param deliveryProgrammeAdminId the ID of the Delivery Programme Admin to delete.
   * @returns the number of records deleted.
   */
  async delete(deliveryProgrammeAdminId: string): Promise<number> {
    const deleteResult = await this.client(TABLE_NAME)
      .where('id', deliveryProgrammeAdminId)
      .del();

    return deleteResult;
  }
}
