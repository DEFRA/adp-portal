import { IProgrammeManagerStore } from '../deliveryProgramme/deliveryProgrammeManagerStore';
import { Entity } from '@backstage/catalog-model';
import { NotFoundError } from '@backstage/errors';
import {
  DeliveryProgramme,
  ProgrammeManager,
} from '@internal/plugin-adp-common';

export interface ICatalog {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    annotations: {
      'graph.microsoft.com/user-id': string;
      'microsoft.com/email': string;
    };
  };
  spec: {
    profile: {
      displayName: string;
    };
  };
}

export async function addProgrammeManager(
  programmeManagers: ProgrammeManager[],
  deliveryProgrammeId: string,
  deliveryProgramme: DeliveryProgramme,
  ProgrammeManagerStore: IProgrammeManagerStore,
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
  ProgrammeManagerStore: IProgrammeManagerStore,
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
  const findManagerById = catalog.find(object => {
    const userId = object.metadata.annotations!['graph.microsoft.com/user-id'];
    return userId === aad_entity_ref_id;
  });

  if (findManagerById !== undefined) {
    const managerById = findManagerById as ICatalog;
    const managerName = managerById.spec.profile.displayName;
    const managerEmail =
      managerById.metadata.annotations['microsoft.com/email'];
    return { name: managerName, email: managerEmail };
  } else {
    throw new NotFoundError(`Could not find Programme Managers details`);
  }
}
