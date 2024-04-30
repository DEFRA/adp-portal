import React, { useState } from 'react';
import { Button } from '@material-ui/core';
import {
  alertApiRef,
  discoveryApiRef,
  fetchApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import { DeliveryProjectClient } from './api/DeliveryProjectClient';
import {
  DeliveryProjectFields,
  DeliveryProjectFormFields,
} from './DeliveryProjectFormFields';
import { usePermission } from '@backstage/plugin-permission-react';
import {
  DeliveryProject,
  adpProjectCreatePermission,
} from '@internal/plugin-adp-common';
import { DialogForm, SubmitResult, deliveryProjectUtil } from '../../utils';

export type EditDeliveryProjectButtonProps = Readonly<
  Omit<Parameters<typeof Button>[0], 'onClick'> & {
    deliveryProject: DeliveryProject;
    onEdited?: () => void;
  }
>;

export function EditDeliveryProjectButton({
  onEdited,
  deliveryProject,
  children,
  ...buttonProps
}: EditDeliveryProjectButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const alertApi = useApi(alertApiRef);
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);

  const client = new DeliveryProjectClient(discoveryApi, fetchApi);

  const { allowed: allowedToEditDeliveryProject } = usePermission({
    permission: adpProjectCreatePermission,
  });

  if (!allowedToEditDeliveryProject) return null;

  async function handleSubmit(
    fields: DeliveryProjectFields,
  ): Promise<SubmitResult<DeliveryProjectFields>> {
    try {
      await client.updateDeliveryProject({
        ...deliveryProject,
        ...fields,
      });
    } catch (e: any) {
      return deliveryProjectUtil.readValidationError(e, fields);
    }
    alertApi.post({
      message: 'Delivery Project updated successfully.',
      severity: 'success',
      display: 'transient',
    });
    return { type: 'success' };
  }

  return (
    <>
      <Button
        data-testid="edit-delivery-project-button"
        {...buttonProps}
        onClick={() => setIsModalOpen(true)}
      >
        {children}
      </Button>
      {isModalOpen && (
        <DialogForm
          defaultValues={deliveryProject}
          renderFields={DeliveryProjectFormFields}
          completed={success => {
            setIsModalOpen(false);
            if (success) onEdited?.();
          }}
          title={`Update Delivery Project ${deliveryProject.title}`}
          confirm="Edit"
          submit={handleSubmit}
          disabled={{
            namespace: true,
            team_type: true,
          }}
        />
      )}
    </>
  );
}
