import {
  ArmsLengthBody,
  DeliveryProgramme,
  ProgrammeManager,
} from '@internal/plugin-adp-common';
import { IdentityApi } from '@backstage/plugin-auth-node';
import express from 'express';
import { AlbRouterOptions } from './service/armsLengthBodyRouter';
import { ProgrammeManagerStore } from './deliveryProgramme/deliveryProgrammeManagerStore';
import { Entity } from '@backstage/catalog-model';
import { NotFoundError } from '@backstage/errors';

export function createName(name: string) {
  const nameValue = name.replace(/\s+/g, '-').toLowerCase().substring(0, 64);
  return nameValue;
}

export function createTransformerTitle(title: string, alias?: string) {
  const titleValue = alias ? title + ' ' + `(${alias})` : title;
  return titleValue;
}

export async function checkForDuplicateTitle(
  store: DeliveryProgramme[] | ArmsLengthBody[],
  title: string,
): Promise<boolean> {
  title = title.trim().toLowerCase();
  const duplicate = store.find(
    object => object.title.trim().toLowerCase() === title,
  );

  return duplicate !== undefined;
}

export async function getCurrentUsername(
  identity: IdentityApi,
  req: express.Request,
): Promise<string> {
  const user = await identity.getIdentity({ request: req });
  return user?.identity.userEntityRef ?? 'unknown';
}

export function getOwner(options: AlbRouterOptions): string {
  const { config } = options;
  const ownerGroup = config.getConfig('rbac');
  const owner = ownerGroup.getString('programmeAdminGroup');
  return owner;
}

export type catalogType = [
  {
    metadata: {
      name: string;
      annotations: {
        'microsoft.com/email': string;
        'graph.microsoft.com/user-id': string;
      };
    };
  },
];

export async function addProgrammeManager(
  programmeManagers: ProgrammeManager[],
  deliveryProgrammeId: string,
  deliveryProgramme: DeliveryProgramme,
  ProgrammeManagerStore: ProgrammeManagerStore,
  catalogEntity: Entity[],
) {
  if (programmeManagers !== undefined) {
    for (const manager of programmeManagers) {
      const managerDetails = await getProgrammeManagerDetails(
        manager.aad_entity_ref_id,
        catalogEntity,
      );
      const store = {
        aad_entity_ref_id: manager.aad_entity_ref_id,
        delivery_programme_id: deliveryProgrammeId,
        name: managerDetails.name,
        email: managerDetails.email,
      };
      const programmeManager = await ProgrammeManagerStore.add(store);
      deliveryProgramme.programme_managers.push(programmeManager);
    }
  }
}

export async function deleteProgrammeManager(
  programmeManagers: ProgrammeManager[],
  deliveryProgrammeId: string,
  ProgrammeManagerStore: ProgrammeManagerStore,
) {
  for (const manager of programmeManagers) {
    const store = {
      aad_entity_ref_id: manager.aad_entity_ref_id,
      delivery_programme_id: deliveryProgrammeId,
      email: manager.email,
      name: manager.name,
    };
    await ProgrammeManagerStore.delete(
      store.aad_entity_ref_id,
      store.delivery_programme_id,
    );
  }
}

export async function getProgrammeManagerDetails(
  aad_entity_ref_id: string,
  catalog: Entity[],
) {
  const findManagerById = catalog.find(
    object =>
      object.metadata.annotations!['graph.microsoft.com/user-id'] ===
      aad_entity_ref_id,
  );
  if (findManagerById !== undefined) {
    const metadataName = findManagerById.metadata.name;
    const name = metadataName
      .replace(/^user:default\//, '')
      .replace(/_defra.*$/, '')
      .replace(/[\._]/g, ' ')
      .replace(/onmicrosoft.*$/, '')
      .trim();

    const managerName = name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const managerEmail =
      findManagerById.metadata.annotations!['microsoft.com/email'];

    return { name: managerName, email: managerEmail };
  } else {
    throw new NotFoundError(`Could not find Programme Managers details`);
  }
}
