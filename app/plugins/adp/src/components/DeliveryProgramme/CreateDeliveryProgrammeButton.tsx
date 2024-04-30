import React, { useState } from 'react';
import { Button } from '@material-ui/core';
import {
  alertApiRef,
  discoveryApiRef,
  fetchApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import { DeliveryProgrammeClient } from './api/DeliveryProgrammeClient';
import {
  DeliveryProgrammeFields,
  DeliveryProgrammeFormFields,
  emptyForm,
} from './DeliveryProgrammeFormFields';
import { usePermission } from '@backstage/plugin-permission-react';
import { adpProgrammmeCreatePermission } from '@internal/plugin-adp-common';
import { DialogForm, SubmitResult, deliveryProgrammeUtil } from '../../utils';

export type CreateDeliveryProgrammeButtonProps = Readonly<
  Omit<Parameters<typeof Button>[0], 'onClick'> & {
    onCreated?: () => void;
  }
>;

export function CreateDeliveryProgrammeButton({
  onCreated,
  children,
  ...buttonProps
}: CreateDeliveryProgrammeButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const alertApi = useApi(alertApiRef);
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);

  const client = new DeliveryProgrammeClient(discoveryApi, fetchApi);

  const { allowed: allowedToCreateDeliveryProgramme } = usePermission({
    permission: adpProgrammmeCreatePermission,
  });
  if (!allowedToCreateDeliveryProgramme) return null;

  async function handleSubmit(
    fields: DeliveryProgrammeFields,
  ): Promise<SubmitResult<DeliveryProgrammeFields>> {
    try {
      await client.createDeliveryProgramme(fields);
    } catch (e: any) {
      return deliveryProgrammeUtil.readValidationError(e, fields);
    }
    alertApi.post({
      message: 'Delivery Programme created successfully.',
      severity: 'success',
      display: 'transient',
    });
    return { type: 'success' };
  }

  return (
    <>
      <Button
        data-testid="create-delivery-programme-button"
        {...buttonProps}
        onClick={() => setIsModalOpen(true)}
      >
        {children}
      </Button>
      {isModalOpen && (
        <DialogForm
          defaultValues={emptyForm}
          renderFields={DeliveryProgrammeFormFields}
          completed={success => {
            setIsModalOpen(false);
            if (success) onCreated?.();
          }}
          title="Create a new Delivery Programme"
          confirm="Create"
          submit={handleSubmit}
        />
      )}
    </>
  );
}
