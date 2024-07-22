import type { DeliveryProject } from '@internal/plugin-adp-common';
import { InputError } from '@backstage/errors';
import type { z } from 'zod';
import { type UUID } from 'node:crypto';
import type { CatalogApi } from '@backstage/catalog-client';
import type { UserEntityV1alpha1 } from '@backstage/catalog-model';

export * from './types';

export function createGithubTeamDetails(deliveryProject: DeliveryProject) {
  return {
    contributors: {
      name: `${deliveryProject.name}-Contributors`,
      description: deliveryProject.description,
    },
    admins: {
      name: `${deliveryProject.name}-Admins`,
      description: deliveryProject.description,
    },
  };
}

export function createParser<Output>(
  schema: z.ZodType<Output, z.ZodTypeDef, unknown>,
) {
  return (body: unknown) => {
    const result = schema.safeParse(body);
    if (result.success) return result.data;
    throw new InputError(result.error.message);
  };
}

export type SafeResult<Success, Error extends PropertyKey> =
  | { success: true; value: Success }
  | { success: false; errors: Array<Error | 'unknown'> };

export const emptyUUID = '00000000-0000-0000-0000-000000000000';

export function isUUID(value: unknown): value is UUID {
  return (
    typeof value === 'string' &&
    /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(value)
  );
}

export function assertUUID(value: unknown): asserts value is UUID {
  if (!isUUID(value)) throw new InputError('Value is not a UUID');
}

export async function checkMany<
  T extends Record<string, boolean | Promise<boolean>>,
>(checks: T): Promise<SafeResult<undefined, keyof T>> {
  const results = await Promise.all(
    Object.entries(checks).map(async e => [e[0], await e[1]] as const),
  );
  const failed = results.filter(x => x[1]);
  if (failed.length === 0) return { success: true, value: undefined };

  return { success: false, errors: failed.map(x => x[0]) };
}

export function containsAnyValue(obj: object) {
  return Object.entries(obj).some(e => e[1] !== undefined);
}

export async function getUserEntityFromCatalog(
  userCatalogName: string,
  catalog: CatalogApi,
  token: string | undefined,
): Promise<SafeResult<UserEntityV1alpha1, 'unknownCatalogUser'>> {
  const catalogUsersResponse = await catalog.getEntities(
    {
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
        'metadata.annotations.graph.microsoft.com/user-principal-name',
        'spec.profile.displayName',
      ],
    },
    { token },
  );

  const catalogUser = catalogUsersResponse.items?.[0];

  if (catalogUser === undefined) {
    return { success: false, errors: ['unknownCatalogUser'] };
  }

  return { success: true, value: catalogUser as UserEntityV1alpha1 };
}
