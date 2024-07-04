import { createRouterRef } from './util';
import { credentialsContextMiddlewareRef } from '@internal/plugin-credentials-context-backend';
import auth from './auth';
import armsLengthBodies from './armsLengthBodies';
import deliveryProgrammes from './deliveryProgrammes';
import deliveryProjects from './deliveryProjects';
import deliveryProgrammeAdmins from './deliveryProgrammeAdmins';
import deliveryProjectUsers from './deliveryProjectUsers';

export default createRouterRef({
  deps: {
    credentialsContextMiddleware: credentialsContextMiddlewareRef,
    auth,
    armsLengthBodies,
    deliveryProgrammes,
    deliveryProjects,
    deliveryProgrammeAdmins,
    deliveryProjectUsers,
  },
  factory({ router, deps }) {
    router.use(deps.auth);
    router.use(deps.credentialsContextMiddleware);
    router.use('/armsLengthBodies', deps.armsLengthBodies);
    router.use('/deliveryProgrammes', deps.deliveryProgrammes);
    router.use('/deliveryProjects', deps.deliveryProjects);
    router.use('/deliveryProgrammeAdmins', deps.deliveryProgrammeAdmins);
    router.use('/deliveryProjectUsers', deps.deliveryProjectUsers);
  },
});
