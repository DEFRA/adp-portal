import type { Knex } from 'knex';
import type { DeliveryProgrammeAdmin } from '@internal/plugin-adp-common';
import type { AddDeliveryProgrammeAdmin } from '../utils';
import {
  delivery_programme_admin_name,
  type delivery_programme_admin,
} from './delivery_programme_admin';
import type { SafeResult } from '../service/util';
import { assertUUID, checkMany, isUUID } from '../service/util';
import type { delivery_programme } from '../deliveryProgramme/delivery_programme';
import { delivery_programme_name } from '../deliveryProgramme/delivery_programme';

export type IDeliveryProgrammeAdminStore = {
  [P in keyof DeliveryProgrammeAdminStore]: DeliveryProgrammeAdminStore[P];
};

const allColumns = [
  'id',
  'delivery_programme_id',
  'aad_entity_ref_id',
  'email',
  'name',
  'updated_at',
] as const satisfies ReadonlyArray<keyof delivery_programme_admin>;

export class DeliveryProgrammeAdminStore {
  readonly #client: Knex;

  constructor(client: Knex) {
    this.#client = client;
  }

  get #table() {
    return this.#client<delivery_programme_admin>(
      delivery_programme_admin_name,
    );
  }

  /**
   * Gets all Delivery Programme Admins from the database.
   * @returns a collection of DeliveryProgrammeAdmin.
   */
  async getAll(): Promise<DeliveryProgrammeAdmin[]> {
    const deliveryProgrammeAdmins = await this.#table
      .select(...allColumns)
      .orderBy('delivery_programme_id');

    return deliveryProgrammeAdmins.map(row => this.#normalize(row));
  }

  /**
   * Gets all Delivery Programme Admins associated with a Delivery Programme.
   * @param delivery_programme_id ID of the delivery programme to query on.
   * @returns a collection of DeliveryProgrammeAdmin associated with the delivery programme.
   */
  async getByDeliveryProgramme(
    delivery_programme_id: string,
  ): Promise<DeliveryProgrammeAdmin[]> {
    const deliveryProgrammeAdmins = await this.#table
      .where('delivery_programme_id', delivery_programme_id)
      .select(...allColumns)
      .orderBy('name', 'asc');

    return deliveryProgrammeAdmins.map(row => this.#normalize(row));
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
    const deliveryProgrammeAdmin = await this.#table
      .where('delivery_programme_id', deliveryProgrammeId)
      .andWhere('aad_entity_ref_id', aadEntityRefId)
      .first(...allColumns);

    return deliveryProgrammeAdmin !== undefined
      ? this.#normalize(deliveryProgrammeAdmin)
      : undefined;
  }

  /**
   * Adds a Delivery Programme Admin to the database.
   * @param deliveryProgrammeAdmin the delivery programme admin to add.
   * @returns A DeliveryProgrammeAdmin with values generated by the database.
   */
  async add(
    deliveryProgrammeAdmin: AddDeliveryProgrammeAdmin,
  ): Promise<
    SafeResult<
      DeliveryProgrammeAdmin,
      'duplicateUser' | 'unknownDeliveryProgramme'
    >
  > {
    const { aad_entity_ref_id, delivery_programme_id, email, name } =
      deliveryProgrammeAdmin;

    const valid = await checkMany({
      duplicateUser: this.#deliveryProgrammeAdminExists(
        aad_entity_ref_id,
        delivery_programme_id,
      ),
      unknownDeliveryProgramme: not(
        this.#deliveryProgrammeExists(delivery_programme_id),
      ),
    });

    if (!valid.success) {
      return valid;
    }

    assertUUID(delivery_programme_id);
    const insertResult = await this.#table.insert(
      {
        delivery_programme_id: delivery_programme_id,
        aad_entity_ref_id: aad_entity_ref_id,
        email: email,
        name: name,
      },
      allColumns,
    );

    if (insertResult.length < 1) {
      return { success: false, errors: ['unknown'] };
    }

    return {
      success: true,
      value: this.#normalize({ ...insertResult[0] }),
    };
  }

  /**
   * Deletes a Delivery Programme Admin from the database.
   * @param deliveryProgrammeAdminId the ID of the Delivery Programme Admin to delete.
   * @returns the number of records deleted.
   */
  async delete(deliveryProgrammeAdminId: string): Promise<number> {
    const deleteResult = await this.#table
      .where('id', deliveryProgrammeAdminId)
      .del();

    return deleteResult;
  }

  #normalize(row: delivery_programme_admin): DeliveryProgrammeAdmin {
    return {
      ...row,
    };
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

  async #deliveryProgrammeAdminExists(
    aadEntityRefId: string,
    deliveryProgrammeId: string,
  ) {
    if (!isUUID(deliveryProgrammeId)) return false;
    const [{ count }] = await this.#client<delivery_programme_admin>(
      delivery_programme_admin_name,
    )
      .where({
        aad_entity_ref_id: aadEntityRefId,
        delivery_programme_id: deliveryProgrammeId,
      })
      .limit(1)
      .count('*', { as: 'count' });
    return Number(count) > 0;
  }
}

async function not(value: Promise<boolean>) {
  return !(await value);
}
