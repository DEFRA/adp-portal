import type { EntityProviderConnection } from '@backstage/plugin-catalog-node';
import type { Logger } from 'winston';
import type {
  AuthService,
  DiscoveryService,
} from '@backstage/backend-plugin-api';
import type { Entity, GroupEntity } from '@backstage/catalog-model';
import type {
  ArmsLengthBody,
  DeliveryProgramme,
  DeliveryProgrammeAdmin,
  DeliveryProject,
  DeliveryProjectUser,
} from '@internal/plugin-adp-common';
import {
  armsLengthBodyGroupTransformer,
  deliveryProgrammeGroupTransformer,
  deliveryProjectGroupTransformer,
} from '../transformers';
import type { FetchApi } from '@internal/plugin-fetch-api-backend';

export class AdpDatabaseEntityProviderConnection {
  readonly #discovery: DiscoveryService;
  readonly #fetchApi: FetchApi;
  readonly #auth: AuthService;
  readonly #connection: EntityProviderConnection;
  readonly #logger: Logger;
  readonly #name: string;

  constructor(
    name: string,
    connection: EntityProviderConnection,
    discovery: DiscoveryService,
    fetchApi: FetchApi,
    auth: AuthService,
    logger: Logger,
  ) {
    this.#name = name;
    this.#connection = connection;
    this.#discovery = discovery;
    this.#fetchApi = fetchApi;
    this.#auth = auth;
    this.#logger = logger;
  }

  public async refresh(): Promise<void> {
    this.#logger.info('Discovering ADP Onboarding Model Entities');

    const { markReadComplete } = this.#trackProgress();

    const albEntities = await this.#readArmsLengthBodies();
    const programmeEntities = await this.#readDeliveryProgrammes();
    const projectEntities = await this.#readDeliveryProjects();

    const entities = [...albEntities, ...programmeEntities, ...projectEntities];

    const { markCommitComplete } = markReadComplete(entities);

    await this.#connection.applyMutation({
      type: 'full',
      entities: entities.map(entity => ({
        locationKey: this.#name,
        entity: entity,
      })),
    });
    markCommitComplete(entities);
  }

  async #readArmsLengthBodies(): Promise<GroupEntity[]> {
    this.#logger.info('Discovering all Arms Length Bodies');
    const armsLengthBodies =
      await this.#getEntities<ArmsLengthBody>('armslengthbody');
    const entities: GroupEntity[] = [];

    this.#logger.info(
      `Discovered ${armsLengthBodies.length} Arms Length Bodies`,
    );

    for (const armsLengthBody of armsLengthBodies) {
      const entity = await armsLengthBodyGroupTransformer(armsLengthBody);
      if (entity) {
        entities.push(entity);
      }
    }

    return entities;
  }

  async #readDeliveryProgrammes(): Promise<GroupEntity[]> {
    this.#logger.info('Discovering all Delivery Programmes');
    const deliveryProgrammes =
      await this.#getEntities<DeliveryProgramme>('deliveryProgramme');
    const entities: GroupEntity[] = [];

    this.#logger.info(
      `Discovered ${deliveryProgrammes.length} Delivery Programmes`,
    );

    for (const deliveryProgramme of deliveryProgrammes) {
      const deliveryProgrammeAdmins =
        (await this.#getEntities<DeliveryProgrammeAdmin>(
          `deliveryProgrammeAdmins/${deliveryProgramme.id}`,
        )) ?? [];

      const entity = await deliveryProgrammeGroupTransformer(
        deliveryProgramme,
        deliveryProgrammeAdmins,
      );
      if (entity) {
        entities.push(entity);
      }
    }

    return entities;
  }

  async #readDeliveryProjects(): Promise<GroupEntity[]> {
    this.#logger.info('Discovering all Delivery Projects');
    const deliveryProjects =
      await this.#getEntities<DeliveryProject>('deliveryProject');
    const entities: GroupEntity[] = [];

    this.#logger.info(
      `Discovered ${deliveryProjects.length} Delivery Programmes`,
    );

    for (const deliveryProject of deliveryProjects) {
      const deliveryProjectUsers =
        (await this.#getEntities<DeliveryProjectUser>(
          `deliveryProjectUsers/${deliveryProject.id}`,
        )) ?? [];

      const entity = await deliveryProjectGroupTransformer(
        deliveryProject,
        deliveryProjectUsers,
      );
      if (entity) {
        entities.push(entity);
      }
    }

    return entities;
  }

  #trackProgress() {
    let timestamp = Date.now();
    const logger = this.#logger;

    function markReadComplete(entities: Entity[]) {
      const readDuration = ((Date.now() - timestamp) / 1000).toFixed(1);
      timestamp = Date.now();
      logger.info(
        `Read ${entities?.length ?? 0} ADP entities in ${readDuration} seconds. Committing...`,
      );
      return { markCommitComplete };
    }

    function markCommitComplete(entities: Entity[]) {
      const commitDuration = ((Date.now() - timestamp) / 1000).toFixed(1);
      logger.info(
        `Committed ${entities?.length ?? 0} ADP entities in ${commitDuration} seconds.`,
      );
    }

    return { markReadComplete };
  }

  async #getEntities<T>(path: string): Promise<T[]> {
    const baseUrl = await this.#discovery.getBaseUrl('adp');
    const { token } = await this.#auth.getPluginRequestToken({
      onBehalfOf: await this.#auth.getOwnServiceCredentials(),
      targetPluginId: 'adp',
    });
    const response = await this.#fetchApi.fetch(`${baseUrl}/${path}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Unexpected response from ADP plugin, GET ${path}. Expected 200 but got ${response.status} - ${response.statusText}`,
      );
    }

    return await response.json();
  }
}
