import type * as MicrosoftGraph from '@microsoft/microsoft-graph-types';
import type { UserEntity } from '@backstage/catalog-model';
import {
  normalizeEntityName,
  MICROSOFT_EMAIL_ANNOTATION,
  MICROSOFT_GRAPH_USER_ID_ANNOTATION,
} from '@backstage/plugin-catalog-backend-module-msgraph';

function hasEmailOrUserPrincipalName(user: MicrosoftGraph.User) {
  return user.mail ? user.mail : user.userPrincipalName;
}

function createEntityFromOriginalUser(
  name: string,
  user: MicrosoftGraph.User,
  email: string,
) {
  const entity: UserEntity = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'User',
    metadata: {
      name,
      annotations: {
        [MICROSOFT_GRAPH_USER_ID_ANNOTATION]: user.id!,
        [MICROSOFT_EMAIL_ANNOTATION]: email,
        'graph.microsoft.com/user-principal-name': user.userPrincipalName!,
      },
    },
    spec: {
      profile: {
        displayName: user.displayName!,
        email: email,
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

function mailIsBlank(user: MicrosoftGraph.User) {
  return (
    user.mail === undefined || user.mail?.length === 0 || user.mail === null
  );
}

function chooseUserPrincipalIfEmailIsBlank(user: MicrosoftGraph.User) {
  return mailIsBlank(user) ? user.userPrincipalName : user.mail;
}

export async function defraUserNameTransformer(
  user: MicrosoftGraph.User,
  userPhoto?: string,
): Promise<UserEntity | undefined> {
  if (!hasEmailOrUserPrincipalName(user)) {
    return undefined;
  }
  const emailAddress = chooseUserPrincipalIfEmailIsBlank(user);
  const name = normalizeEntityName(emailAddress!);
  const entity = createEntityFromOriginalUser(name, user, emailAddress!);
  return addPhotoIfRequired(userPhoto, entity);
}
