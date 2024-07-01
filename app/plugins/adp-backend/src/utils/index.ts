import type { DeliveryProject } from '@internal/plugin-adp-common';
import type { IdentityApi } from '@backstage/plugin-auth-node';
import type express from 'express';
import type { Config } from '@backstage/config';

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
