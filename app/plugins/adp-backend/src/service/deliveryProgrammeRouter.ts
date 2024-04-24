import { PluginDatabaseManager, errorHandler } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { InputError } from '@backstage/errors';
import { IdentityApi } from '@backstage/plugin-auth-node';
import { DiscoveryApi } from '@backstage/core-plugin-api';
import { CatalogClient } from '@backstage/catalog-client';
import { AdpDatabase } from '../database/adpDatabase';
import {
  DeliveryProgrammeStore,
  PartialDeliveryProgramme,
} from '../deliveryProgramme/deliveryProgrammeStore';
import {
  DeliveryProgramme,
  ProgrammeManager,
} from '@internal/plugin-adp-common';
import {
  checkForDuplicateProgrammeCode,
  checkForDuplicateTitle,
  getCurrentUsername,
} from '../utils/index';
import { ProgrammeManagerStore } from '../deliveryProgramme/deliveryProgrammeManagerStore';
import { Entity } from '@backstage/catalog-model';
import {
  addProgrammeManager,
  deleteProgrammeManager,
} from '../service-utils/deliveryProgrammeUtils';
import { DeliveryProjectStore } from '../deliveryProject/deliveryProjectStore';

export interface ProgrammeRouterOptions {
  logger: Logger;
  identity: IdentityApi;
  database: PluginDatabaseManager;
  discovery: DiscoveryApi;
}

function hasTitleChanged(updatedTitle: any, currentData: DeliveryProgramme | undefined) {
  return updatedTitle && updatedTitle !== currentData!.title;
}

function hasDeliveryProgramChanged(updatedCode: any, currentData: DeliveryProgramme | undefined) {
  return updatedCode && updatedCode !== currentData!.delivery_programme_code;
}
function findManagers(listToSearch: ProgrammeManager[], programmeManagers: ProgrammeManager[]) {
  const foundManagers: ProgrammeManager[] = []
  for (const lookupmanager of listToSearch) {
    if (
      !programmeManagers.some(
        (manager: ProgrammeManager) =>
          manager.aad_entity_ref_id === lookupmanager.aad_entity_ref_id,
      )
    ) {
      foundManagers.push(lookupmanager);
    }
  }
  return foundManagers;
}

export async function createProgrammeRouter(
  options: ProgrammeRouterOptions,
): Promise<express.Router> {
  const { logger, identity, database, discovery } = options;
  const catalog = new CatalogClient({ discoveryApi: discovery });
  const adpDatabase = AdpDatabase.create(database);
  const deliveryProgrammesStore = new DeliveryProgrammeStore(
    await adpDatabase.get(),
  );
  const programmeManagersStore = new ProgrammeManagerStore(
    await adpDatabase.get(),
  );
  const deliveryProjectStore = new DeliveryProjectStore(
    await adpDatabase.get(),
  );

  const router = Router();
  router.use(express.json());

  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.json({ status: 'ok' });
  });

  router.get('/deliveryProgramme', async (_req, res) => {
    try {
      const programmeData = await deliveryProgrammesStore.getAll();
      const projectData = await deliveryProjectStore.getAll();
      for (const programme of programmeData) {
        let programmeChildren = [];
        for (const project of projectData) {
          if (project.delivery_programme_id === programme.id) {
            programmeChildren.push(project.name);
            programme.children = programmeChildren;
          }
        }
      }
      res.json(programmeData);
    } catch (error) {
      const deliveryProgramError = error as Error;
      logger.error(
        'Error in retrieving delivery programmes: ',
        deliveryProgramError,
      );
      throw new InputError(deliveryProgramError.message);
    }
  });

  router.get('/programmeManager', async (_req, res) => {
    try {
      const data = await programmeManagersStore.getAll();
      res.json(data);
    } catch (error) {
      const deliveryProgramError = error as Error;
      logger.error(
        'Error in retrieving programme managers: ',
        deliveryProgramError,
      );
      throw new InputError(deliveryProgramError.message);
    }
  });

  router.get('/deliveryProgramme/:id', async (_req, res) => {
    try {
      const deliveryProgramme = await deliveryProgrammesStore.get(
        _req.params.id,
      );
      const programmeManager = await programmeManagersStore.get(_req.params.id);
      if (programmeManager && deliveryProgramme !== null) {
        deliveryProgramme.programme_managers = programmeManager;
        res.json(deliveryProgramme);
      }
    } catch (error) {
      const deliveryProgramError = error as Error;
      logger.error(
        'Error in retrieving delivery programme: ',
        deliveryProgramError,
      );
      throw new InputError(deliveryProgramError.message);
    }
  });

  router.get('/catalogEntities', async (_req, res) => {
    try {
      const catalogApiResponse = await catalog.getEntities({
        filter: {
          kind: 'User',
        },
        fields: [
          'metadata.name',
          'metadata.annotations.graph.microsoft.com/user-id',
          'metadata.annotations.microsoft.com/email',
          'spec.profile.displayName',
        ],
      });
      res.json(catalogApiResponse);
    } catch (error) {
      const deliveryProgramError = error as Error;
      logger.error(
        'Error in retrieving catalog entities: ',
        deliveryProgramError,
      );
      throw new InputError(deliveryProgramError.message);
    }
  });

  router.post('/deliveryProgramme', async (req, res) => {
    try {
      if (!isDeliveryProgrammeCreateRequest(req.body)) {
        throw new InputError('Invalid payload');
      }

      const data: DeliveryProgramme[] = await deliveryProgrammesStore.getAll();

      
      const isDuplicateTitle: boolean = await checkForDuplicateTitle(
        data,
        req.body.title,
      );

      
      const isDuplicateCode: boolean = await checkForDuplicateProgrammeCode(
        data,
        req.body.delivery_programme_code,
      );

      if (isDuplicateTitle) {
        res
          .status(406)
          .json({ error: 'Delivery Programme title already exists' });
        return; 
      }

      if (isDuplicateCode) {
        res
          .status(406)
          .json({ error: 'Delivery Programme code already exists' });
        return; 
      }
      const author = await getCurrentUsername(identity, req);
      const deliveryProgramme = await deliveryProgrammesStore.add(
        req.body,
        author,
      );
      const programmeManagers = req.body.programme_managers;
      if (programmeManagers !== undefined) {
        const catalogEntities = await catalog.getEntities({
          filter: {
            kind: 'User',
          },
          fields: [
            'metadata.name',
            'metadata.annotations.graph.microsoft.com/user-id',
            'metadata.annotations.microsoft.com/email',
            'spec.profile.displayName',
          ],
        });

        const catalogEntity: Entity[] = catalogEntities.items;

        addProgrammeManager(
          programmeManagers,
          deliveryProgramme.id,
          deliveryProgramme,
          programmeManagersStore,
          catalogEntity,
        );
      } else {
        req.body.programme_managers = [];
      }
      res.status(201).json(deliveryProgramme);
    } catch (error) {
      const deliveryProgramError = error as Error;
      logger.error(
        'Error in creating a delivery programme: ',
        deliveryProgramError,
      );
      throw new InputError(deliveryProgramError.message);
    }
  });

  router.patch('/deliveryProgramme', async (req, res) => {
    try {
      const requestBody = { ...req.body };
      delete requestBody.tableData;

      if (!isDeliveryProgrammeUpdateRequest(requestBody)) {
        throw new InputError('Invalid payload');
      }

      const allProgrammes: DeliveryProgramme[] =
        await deliveryProgrammesStore.getAll();

      const currentData = allProgrammes.find(
        programme => programme.id === req.body.id,
      );

      const updatedTitle = requestBody?.title;
      const updatedCode = requestBody?.delivery_programme_code;
    
      if (hasTitleChanged(updatedTitle, currentData)) {
        const isDuplicateTitle = await checkForDuplicateTitle(allProgrammes, updatedTitle);
        if (isDuplicateTitle) {
          res.status(406).json({ error: 'Delivery Programme title already exists' });
          return;
        }
      }
  
      if (hasDeliveryProgramChanged(updatedCode, currentData)) {
        const isDuplicateCode = await checkForDuplicateProgrammeCode(allProgrammes, updatedCode);
        if (isDuplicateCode) {
          res.status(406).json({ error: 'Delivery Programme code already exists' });
          return;
        }
      }


      const author = await getCurrentUsername(identity, req);
      const deliveryProgramme = await deliveryProgrammesStore.update(
        requestBody,
        author,
      );
      const programmeManagers = req.body.programme_managers;
      if (programmeManagers !== undefined) {
        const existingProgrammeManagers = await programmeManagersStore.get(
          deliveryProgramme.id,
        );
        const updatedManagers: ProgrammeManager[] = findManagers(programmeManagers, existingProgrammeManagers);

        const catalogEntities = await catalog.getEntities({
          filter: {
            kind: 'User',
          },
          fields: [
            'metadata.name',
            'metadata.annotations.graph.microsoft.com/user-id',
            'metadata.annotations.microsoft.com/email',
            'spec.profile.displayName',
          ],
        });

        const catalogEntity: Entity[] = catalogEntities.items;

        await addProgrammeManager(
          updatedManagers,
          deliveryProgramme.id,
          deliveryProgramme,
          programmeManagersStore,
          catalogEntity,
        );

        const removedManagers: ProgrammeManager[] = findManagers(existingProgrammeManagers, programmeManagers);

        await deleteProgrammeManager(
          removedManagers,
          deliveryProgramme.id,
          programmeManagersStore,
        );
      }
      res.status(200).json(deliveryProgramme);
    } catch (error) {
      const deliveryProgramError = error as Error;
      logger.error(
        'Error in updating a delivery project: ',
        deliveryProgramError,
      );
      throw new InputError(deliveryProgramError.message);
    }
  });

  router.use(errorHandler());
  return router;
}

function isDeliveryProgrammeCreateRequest(
  request: Omit<DeliveryProgramme, 'id' | 'created_at'>,
) {
  return typeof request?.title === 'string';
}

function isDeliveryProgrammeUpdateRequest(
  request: Omit<PartialDeliveryProgramme, 'updated_at'>,
) {
  return typeof request?.id === 'string';
}
