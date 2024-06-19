import React, { useState } from 'react';
import { Button } from '@material-ui/core';
import type { DeliveryProjectUser } from '@internal/plugin-adp-common';
import { deliveryProjectUserDeletePermission } from '@internal/plugin-adp-common';
import { deliveryProjectUserApiRef } from './api';
import { alertApiRef, useApi } from '@backstage/core-plugin-api';
import { usePermission } from '@backstage/plugin-permission-react';
import { ConfirmationDialog } from '../../utils';

export type RemoveDeliveryProjectUserButtonProps = Readonly<
  Omit<Parameters<typeof Button>[0], 'onClick'> & {
    deliveryProjectUser: DeliveryProjectUser;
    onRemoved?: () => void;
  }
>;

export function RemoveDeliveryProjectUserButton({
  deliveryProjectUser,
  onRemoved,
  ...buttonProps
}: RemoveDeliveryProjectUserButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const alertApi = useApi(alertApiRef);
  const client = useApi(deliveryProjectUserApiRef);
  const { allowed: canRemoveProjectUser } = usePermission({
    permission: deliveryProjectUserDeletePermission,
    resourceRef: deliveryProjectUser.id,
  });

  if (!canRemoveProjectUser) return null;

  async function handleDelete() {
    await client.delete(
      deliveryProjectUser.id,
      deliveryProjectUser.delivery_project_id,
    );
    onRemoved?.();
    alertApi.post({
      message: `Removed ${deliveryProjectUser.name} from this delivery project`,
      display: 'transient',
      severity: 'success',
    });
  }

  return (
    <>
      <Button
        {...buttonProps}
        onClick={() => setIsModalOpen(true)}
        data-testid="remove-delivery-project-user-button"
      >
        Remove
      </Button>

      {isModalOpen && (
        <ConfirmationDialog
          title={`Remove ${deliveryProjectUser.name}?`}
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
