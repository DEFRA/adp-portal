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
  emptyForm,
} from './DeliveryProjectFormFields';
import { usePermission } from '@backstage/plugin-permission-react';
import { adpProjectCreatePermission } from '@internal/plugin-adp-common';
import { DialogForm, SubmitResult, deliveryProjectUtil } from '../../utils';

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
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);

  const client = new DeliveryProjectClient(discoveryApi, fetchApi);

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
      return deliveryProjectUtil.readValidationError(e, fields);
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
          }}
          renderFields={DeliveryProjectFormFields}
          completed={success => {
            setIsModalOpen(false);
            if (success) onCreated?.();
          }}
          title="Create a new Delivery Project"
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
