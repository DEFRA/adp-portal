import type {
  DeliveryProject,
  ValidationErrorMapping,
} from '@internal/plugin-adp-common';
import type { IdentityApi } from '@backstage/plugin-auth-node';
import type express from 'express';
import type { Config } from '@backstage/config';
import type { Response } from 'express';
import { InputError, NotAllowedError } from '@backstage/errors';
import type { z } from 'zod';
import { type UUID } from 'node:crypto';
import type {
  BackstageCredentials,
  PermissionsService,
} from '@backstage/backend-plugin-api';
import type { AuthorizePermissionRequest } from '@backstage/plugin-permission-common';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import type { CatalogApi } from '@backstage/catalog-client';
import type { UserEntityV1alpha1 } from '@backstage/catalog-model';

export * from './types';

export async function getCurrentUsername(
  identity: IdentityApi,
  req: express.Request,
): Promise<string> {
  const user = await identity.getIdentity({ request: req });
  return user?.identity.userEntityRef ?? 'unknown';
}

export function getOwner(config: Config): string {
  const ownerGroup = config.getConfig('rbac');
  const owner = ownerGroup.getString('programmeAdminGroup');
  return owner;
}

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

export function respond<Request, Success, Error extends string>(
  request: Request,
  response: Response,
  message:
    | { success: true; value: Success }
    | { success: false; errors: Error[] },
  mapping: ValidationErrorMapping<Request, Error>,
  statuses?: { ok?: number; badRequest?: number },
) {
  if (!message.success) {
    response.status(statuses?.badRequest ?? 400).json({
      errors: message.errors.map(e => mapping[e](request)),
    });
  } else if (message.value === undefined) {
    response.status(statuses?.ok ?? 204).end();
  } else {
    response.status(statuses?.ok ?? 200).json(message.value);
  }
}

export function createParser<T>(schema: z.ZodType<T>) {
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
  const results: Array<readonly [keyof T, boolean]> = await Promise.all(
    Object.entries(checks).map(async e => [e[0], await e[1]] as const),
  );
  const failed = results.filter(x => x[1]);
  if (failed.length === 0) return { success: true, value: undefined };

  return { success: false, errors: failed.map(x => x[0]) };
}

export function containsAnyValue(obj: object) {
  return Object.entries(obj).some(e => e[1] !== undefined);
}

export async function checkPermissions(
  credentials: BackstageCredentials,
  permissions: AuthorizePermissionRequest[],
  permissionsService: PermissionsService,
) {
  const decisions = await permissionsService.authorize(permissions, {
    credentials: credentials,
  });

  for (const decision of decisions) {
    if (decision.result === AuthorizeResult.DENY) {
      throw new NotAllowedError('Unauthorized');
    }
  }
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
