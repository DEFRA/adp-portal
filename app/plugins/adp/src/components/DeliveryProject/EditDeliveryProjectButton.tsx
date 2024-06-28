import React, { useState } from 'react';
import { Button } from '@material-ui/core';
import { alertApiRef, useApi } from '@backstage/core-plugin-api';
import type { DeliveryProjectFields } from './DeliveryProjectFormFields';
import {
  DeliveryProjectFormFields,
  emptyForm,
} from './DeliveryProjectFormFields';
import { usePermission } from '@backstage/plugin-permission-react';
import type { DeliveryProject } from '@internal/plugin-adp-common';
import {
  deliveryProjectDisplayName,
  deliveryProjectUpdatePermission,
} from '@internal/plugin-adp-common';
import type { SubmitResult } from '../../utils';
import {
  DialogForm,
  TitleWithHelp,
  populate,
  readValidationError,
} from '../../utils';
import { deliveryProjectApiRef } from './api';

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
  const client = useApi(deliveryProjectApiRef);

  const { allowed: allowedToEditDeliveryProject } = usePermission({
    permission: deliveryProjectUpdatePermission,
    resourceRef: deliveryProject.id,
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
      return readValidationError(e);
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
          defaultValues={populate(emptyForm, deliveryProject)}
          renderFields={DeliveryProjectFormFields}
          completed={success => {
            setIsModalOpen(false);
            if (success) onEdited?.();
          }}
          title={
            <TitleWithHelp href="https://defra.github.io/adp-documentation/Getting-Started/onboarding-a-delivery-project/">
              {`Update Delivery Project ${deliveryProjectDisplayName(
                deliveryProject,
              )}`}
            </TitleWithHelp>
          }
          confirm="Update"
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
