import { createEndpointRef } from '../util';
import { adoProjectApiRef } from '../../deliveryProject';
import { type Request } from 'express';

export default createEndpointRef({
  name: 'checkIfAdoProjectExists',
  deps: {
    adoProjectApi: adoProjectApiRef,
  },
  factory({ deps: { adoProjectApi }, responses: { ok } }) {
    return async (request: Request<{ projectName: string }>) => {
      const response = await adoProjectApi.checkIfAdoProjectExists(
        request.params.projectName,
      );
      return ok().json({ exists: response });
    };
  },
});
