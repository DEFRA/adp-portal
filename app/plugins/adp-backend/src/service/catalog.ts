import type { CatalogApi } from '@backstage/catalog-client';
import type { UserEntityV1alpha1 } from '@backstage/catalog-model';
import type { SafeResult } from './util';

export async function getUserEntityFromCatalog(
  userCatalogName: string,
  catalog: CatalogApi,
): Promise<SafeResult<UserEntityV1alpha1, 'unknownCatalogUser'>> {
  const catalogUsersResponse = await catalog.getEntities({
    filter: [
      {
        kind: 'User',
        'metadata.name': userCatalogName,
      },
    ],
    fields: [
      'metadata.name',
      'metadata.annotations.graph.microsoft.com/user-id',
      'metadata.annotations.microsoft.com/email',
      'spec.profile.displayName',
    ],
  });

  const catalogUser = catalogUsersResponse.items?.[0];

  if (catalogUser === undefined) {
    return { success: false, errors: ['unknownCatalogUser'] };
  }

  return { success: true, value: catalogUser as UserEntityV1alpha1 };
}
