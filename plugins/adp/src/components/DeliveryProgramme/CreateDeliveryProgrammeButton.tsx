import React, { useState } from 'react';
import { Button } from '@material-ui/core';
import { alertApiRef, useApi } from '@backstage/core-plugin-api';
import type { DeliveryProgrammeFields } from './DeliveryProgrammeFormFields';
import {
  DeliveryProgrammeFormFields,
  emptyForm,
} from './DeliveryProgrammeFormFields';
import { usePermission } from '@backstage/plugin-permission-react';
import { deliveryProgrammeCreatePermission } from '@internal/plugin-adp-common';
import type { SubmitResult } from '../../utils';
import { DialogForm, TitleWithHelp, readValidationError } from '../../utils';
import { deliveryProgrammeApiRef } from './api';

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
  const client = useApi(deliveryProgrammeApiRef);

  const { allowed: allowedToCreateDeliveryProgramme } = usePermission({
    permission: deliveryProgrammeCreatePermission,
  });
  if (!allowedToCreateDeliveryProgramme) return null;

  async function handleSubmit(
    fields: DeliveryProgrammeFields,
  ): Promise<SubmitResult<DeliveryProgrammeFields>> {
    try {
      await client.createDeliveryProgramme(fields);
    } catch (e: any) {
      return readValidationError(e);
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
          title={
            <TitleWithHelp href="https://defra.github.io/adp-documentation/Getting-Started/onboarding-a-delivery-programme/">
              Create a new Delivery Programme
            </TitleWithHelp>
          }
          confirm="Create"
          submit={handleSubmit}
        />
      )}
    </>
  );
}
