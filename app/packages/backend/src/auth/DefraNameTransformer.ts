import * as MicrosoftGraph from '@microsoft/microsoft-graph-types';

import {  UserEntity } from '@backstage/catalog-model';
import {
  normalizeEntityName
} from '@backstage/plugin-catalog-backend-module-msgraph';
import {
  MICROSOFT_EMAIL_ANNOTATION,
  MICROSOFT_GRAPH_USER_ID_ANNOTATION,
} from '@backstage/plugin-catalog-backend-module-msgraph';
// Can we write a test for theis function in tha file with the same name

function hasEmailOrUserPrincipalName(user:  MicrosoftGraph.User) {
  return user.mail || user.userPrincipalName ;
}

function createEntitiyFromOrignalUser(name: string, user:  MicrosoftGraph.User, idToUse: string | undefined | null) {
  const entity: UserEntity = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'User',
    metadata: {
      name,
      annotations: {
        [MICROSOFT_EMAIL_ANNOTATION]: user.mail!,
        [MICROSOFT_GRAPH_USER_ID_ANNOTATION]: user.id!,
      },
    },
    spec: {
      profile: {
        displayName: user.displayName!,
        email: idToUse!,
      },
      memberOf: [],
    },
  };
  return entity;
}

function addPhotoIfRequired(userPhoto: string | undefined, entity: UserEntity) {
  if (userPhoto) {
    entity.spec.profile!.picture = userPhoto;
  }

  return entity;
}

function mailIsBlank(user: User) {
  return user.mail === undefined || user.mail?.length === 0 || user.mail === null;
}

function chooseUserPrincipalIfEmailIsBlank(user:  MicrosoftGraph.User) {
  return mailIsBlank(user) ? user.userPrincipalName:  user.mail;
}

export async function defraADONameTransformer(
  user: MicrosoftGraph.User,
  userPhoto?: string,
): Promise<UserEntity | undefined> {
    if (!hasEmailOrUserPrincipalName(user) ) {
      return undefined;
    }
    const idToUse  = chooseUserPrincipalIfEmailIsBlank(user);
    const name = normalizeEntityName(idToUse);
    const entity = createEntitiyFromOrignalUser(name, user, idToUse);
    return addPhotoIfRequired(userPhoto, entity);

}
