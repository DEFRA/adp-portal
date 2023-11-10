import { createRouter } from '@backstage/plugin-permission-backend';
import {
    BackstageIdentityResponse,
    IdentityClient
} from '@backstage/plugin-auth-node';
import {
    AuthorizeResult,
    PolicyDecision,
    isPermission
} from '@backstage/plugin-permission-common';
import {
    PermissionPolicy,
    PolicyQuery,
} from '@backstage/plugin-permission-node';
import { Router } from 'express';
import { PluginEnvironment } from '../types';
import {
    catalogConditions,
    createCatalogConditionalDecision,
} from '@backstage/plugin-catalog-backend/alpha';
import {
    catalogEntityDeletePermission,
} from '@backstage/plugin-catalog-common/alpha';

class CatalogDeletePermissionPolicy implements PermissionPolicy {
    async handle(
        request: PolicyQuery,
        user?: BackstageIdentityResponse,
    ): Promise<PolicyDecision> {
        if (isPermission(request.permission, catalogEntityDeletePermission)) {
            return createCatalogConditionalDecision(
                request.permission,
                catalogConditions.isEntityOwner({
                    claims: user?.identity.ownershipEntityRefs ?? [],
                }),
            );
        }
        return { result: AuthorizeResult.ALLOW };
    }
}

export default async function createPlugin(
    env: PluginEnvironment,
): Promise<Router> {
    return await createRouter({
        config: env.config,
        logger: env.logger,
        discovery: env.discovery,
        policy: new CatalogDeletePermissionPolicy(),
        identity: env.identity,
    });
}