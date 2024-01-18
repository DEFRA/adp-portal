import { createRouter } from '@backstage/plugin-permission-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';
import { AdpPortalPermissionPolicy, RbacUtilities, RbacGroups } from '../permissions';
import {} from '../permissions'

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {

  const rbacGroups: RbacGroups = {
    platformAdminsGroup: env.config.getString('rbac.platformAdminsGroup'),
    programmeAdminGroup: env.config.getString('rbac.programmeAdminGroup'),
    adpPortalUsersGroup: env.config.getString('rbac.adpPortalUsersGroup')
  }

  return await createRouter({
    config: env.config,
    logger: env.logger,
    discovery: env.discovery,
    policy: new AdpPortalPermissionPolicy(new RbacUtilities(env.logger, rbacGroups), env.logger),
    identity: env.identity,
  });
}
