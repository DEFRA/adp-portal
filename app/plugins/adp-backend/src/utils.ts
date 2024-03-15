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

  console.log("getProgrammeManagerDetails called with aad_entity_ref_id:", aad_entity_ref_id);
  console.log("Catalog length:", catalog.length);

  // catalog.forEach(object => {
  //   let userId;
  //   if (object.metadata.annotations && 'graph.microsoft.com/user-id' in object.metadata.annotations) {
  //     userId = object.metadata.annotations['graph.microsoft.com/user-id'];
  //   }
  //   console.log(userId);
  // });

  catalog.forEach((item, index) => {
    console.log(`Item ${index + 1}:`, item);
  });

  const findManagerById = catalog.find(object => {
    const userId = object.metadata.annotations!['graph.microsoft.com/user-id'];
    console.log("Comparing against userId:", userId);
    return userId === aad_entity_ref_id;
  });

if (findManagerById !== undefined) {
  console.log("Manager found:", findManagerById);
      const metadataName = findManagerById.metadata.name;

      console.log("Original metadataName:", metadataName);

      const name = metadataName
        .replace(/^user:default\//, '')
        .replace(/_defra.*$/, '')
        .replace(/[\._]/g, ' ')
        .replace(/onmicrosoft.*$/, '')
        .trim()

      
        console.log("Processed name before capitalization:", name);

      const managerName = name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

        console.log("Final managerName:", managerName);

      const managerEmail =
      findManagerById.metadata.annotations!['microsoft.com/email'];

      console.log("Manager email:", managerEmail);


      return { name: managerName, email: managerEmail };
    } else {
      console.log("Manager not found for aad_entity_ref_id:", aad_entity_ref_id);
    throw new NotFoundError(
      `Could not find Programme Managers details`,
    );
  }
}
