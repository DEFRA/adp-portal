import { alertApiRef, useApi } from '@backstage/core-plugin-api';
import { Button } from '@material-ui/core';
import React from 'react';
import { deliveryProgrammeAdminApiRef } from './api';
import { usePermission } from '@backstage/plugin-permission-react';
import type { DeliveryProgrammeAdmin } from '@internal/plugin-adp-common';
import { deliveryProgrammeAdminDeletePermission } from '@internal/plugin-adp-common';

export type RemoveDeliveryProgrammeAdminButtonProps = Readonly<
  Omit<Parameters<typeof Button>[0], 'onClick'> & {
    deliveryProgrammeAdmin: DeliveryProgrammeAdmin;
    entityRef: string;
    onRemoved?: () => void;
  }
>;

export function RemoveDeliveryProgrammeAdminButton({
  deliveryProgrammeAdmin,
  entityRef,
  onRemoved,
  ...buttonProps
}: RemoveDeliveryProgrammeAdminButtonProps) {
  const alertApi = useApi(alertApiRef);
  const client = useApi(deliveryProgrammeAdminApiRef);
  const { allowed: canRemoveProgrammeAdmin } = usePermission({
    permission: deliveryProgrammeAdminDeletePermission,
    resourceRef: entityRef,
  });

  if (!canRemoveProgrammeAdmin) return null;

  async function handleDelete() {
    await client.delete(deliveryProgrammeAdmin.id, entityRef);
    onRemoved?.();
    alertApi.post({
      message: `Removed ${deliveryProgrammeAdmin.name} from this delivery programme`,
      display: 'transient',
      severity: 'success',
    });
  }

  return (
    <Button {...buttonProps} onClick={handleDelete}>
      Remove
    </Button>
  );
}
