import { alertApiRef, useApi } from '@backstage/core-plugin-api';
import { Button } from '@material-ui/core';
import React, { useState } from 'react';
import { deliveryProgrammeAdminApiRef } from './api';
import { usePermission } from '@backstage/plugin-permission-react';
import type { DeliveryProgrammeAdmin } from '@internal/plugin-adp-common';
import { deliveryProgrammeAdminDeletePermission } from '@internal/plugin-adp-common';
import { ConfirmationDialog } from '../../utils';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    <>
      <Button
        {...buttonProps}
        onClick={() => setIsModalOpen(true)}
        data-testid="remove-delivery-programme-admin-button"
      >
        Remove
      </Button>

      {isModalOpen && (
        <ConfirmationDialog
          title={`Remove ${deliveryProgrammeAdmin.name}?`}
          content="Are you sure you want to remove this user? The user will no longer be able to perform certain actions on the ADP portal. You can re-add the user after removing them."
          confirm="Remove"
          confirmColour="secondary"
          completed={submitted => {
            setIsModalOpen(false);
            if (submitted) onRemoved?.();
          }}
          submit={handleDelete}
        />
      )}
    </>
  );
}
