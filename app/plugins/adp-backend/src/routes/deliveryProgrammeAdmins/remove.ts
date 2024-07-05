import { deliveryProgrammeAdminStoreRef } from '../../deliveryProgrammeAdmin';
import { createParser } from '../../utils';
import { type DeleteDeliveryProgrammeAdminRequest } from '@internal/plugin-adp-common';
import { coreServices } from '@backstage/backend-plugin-api';
import { fireAndForgetCatalogRefresherRef } from '../../services';
import { createEndpointRef } from '../util';
import { z } from 'zod';

export default createEndpointRef({
  name: 'removeDeliveryProgrammeAdmin',
  deps: {
    logger: coreServices.logger,
    deliveryProgrammeAdminStore: deliveryProgrammeAdminStoreRef,
    catalogRefresher: fireAndForgetCatalogRefresherRef,
  },
  factory({
    deps: { logger, deliveryProgrammeAdminStore, catalogRefresher },
    responses: { noContent },
  }) {
    const parseBody = createParser<DeleteDeliveryProgrammeAdminRequest>(
      z.object({
        delivery_programme_admin_id: z.string(),
        group_entity_ref: z.string(),
      }),
    );

    return async request => {
      const body = parseBody(request.body);
      await deliveryProgrammeAdminStore.delete(
        body.delivery_programme_admin_id,
      );

      logger.info(
        `DELETE /: Deleted Delivery Programme Admin with ID ${body.delivery_programme_admin_id}`,
      );

      await catalogRefresher.refresh(`location:default/delivery-programmes`);

      return noContent();
    };
  },
});
