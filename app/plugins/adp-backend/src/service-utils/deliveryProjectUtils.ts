import { DeliveryProjectUserStore } from '../deliveryProjectUser/deliveryProjectUserStore';
import { Entity } from '@backstage/catalog-model';
import { NotFoundError } from '@backstage/errors';
import {
  DeliveryProject,
  DeliveryProjectUser,
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

export async function addProjectUser(
  projectUsers: DeliveryProjectUser[],
  deliveryProjectId: string,
  isAdmin: boolean,
  isTechnical: boolean,
  deliveryProject: DeliveryProject,
  ProjectUserStore: DeliveryProjectUserStore,
  catalogEntity: Entity[],
) {
  if (projectUsers !== undefined) {
    for (const user of projectUsers) {
      const userDetails = await getProjectUsersDetails(
        user.email,
        catalogEntity,
      );
      const store = {
        aad_entity_ref_id: user.aad_entity_ref_id,
        delivery_project_id: deliveryProjectId,
        is_technical: isTechnical,
        is_admin: isAdmin,
        name: userDetails.name,
        email: userDetails.email,
      };
      const projectUser = await ProjectUserStore.add(store);
      deliveryProject.delivery_project_users.push(projectUser);
    }
  }
}

export async function getProjectUsersDetails(email: string, catalog: Entity[]) {
  const findUserByEmail = catalog.find(object => {
    const userEmail = object.metadata.annotations!['microsoft.com/email'];
    return userEmail === email;
  });

  if (findUserByEmail !== undefined) {
    const userByEmail = findUserByEmail as ICatalog;
    const userName = userByEmail.spec.profile.displayName;
    const userEntity =
      userByEmail.metadata.annotations['graph.microsoft.com/user-id'];
    return { name: userName, aad_entity_ref: userEntity, email: email };
  } else {
    throw new NotFoundError(`Could not find Project Users details`);
  }
}
