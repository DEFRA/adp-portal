import React, { useState } from 'react';
import { Button } from '@material-ui/core';
import { alertApiRef, useApi } from '@backstage/core-plugin-api';
import type { DeliveryProjectFields } from './DeliveryProjectFormFields';
import {
  DeliveryProjectFormFields,
  emptyForm,
} from './DeliveryProjectFormFields';
import { usePermission } from '@backstage/plugin-permission-react';
import { adpProjectCreatePermission } from '@internal/plugin-adp-common';
import type { SubmitResult } from '../../utils';
import { DialogForm, TitleWithHelp, readValidationError } from '../../utils';
import { deliveryProjectApiRef } from './api';

export type CreateDeliveryProjectButtonProps = Readonly<
  Omit<Parameters<typeof Button>[0], 'onClick'> & {
    onCreated?: () => void;
  }
>;

export function CreateDeliveryProjectButton({
  onCreated,
  children,
  ...buttonProps
}: CreateDeliveryProjectButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const alertApi = useApi(alertApiRef);
  const client = useApi(deliveryProjectApiRef);

  const { allowed: allowedToCreateDeliveryProject } = usePermission({
    permission: adpProjectCreatePermission,
  });

  if (!allowedToCreateDeliveryProject) return null;

  async function handleSubmit(
    fields: DeliveryProjectFields,
  ): Promise<SubmitResult<DeliveryProjectFields>> {
    try {
      await client.createDeliveryProject(fields);
    } catch (e: any) {
      return readValidationError(e);
    }
    alertApi.post({
      message: 'Delivery Project created successfully.',
      severity: 'success',
      display: 'transient',
    });
    return { type: 'success' };
  }

  return (
    <>
      <Button
        data-testid="create-delivery-project-button"
        {...buttonProps}
        onClick={() => setIsModalOpen(true)}
      >
        {children}
      </Button>
      {isModalOpen && (
        <DialogForm
          defaultValues={{
            ...emptyForm,
            team_type: 'delivery',
            github_team_visibility: 'public',
          }}
          renderFields={DeliveryProjectFormFields}
          completed={success => {
            setIsModalOpen(false);
            if (success) onCreated?.();
          }}
          title={
            <TitleWithHelp href="https://defra.github.io/adp-documentation/Getting-Started/onboarding-a-delivery-project/">
              Create a new Delivery Project
            </TitleWithHelp>
          }
          confirm="Create"
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
