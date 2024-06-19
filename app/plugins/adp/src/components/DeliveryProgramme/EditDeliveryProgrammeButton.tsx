import React, { useState } from 'react';
import { Button } from '@material-ui/core';
import { alertApiRef, useApi } from '@backstage/core-plugin-api';
import type { DeliveryProgrammeFields } from './DeliveryProgrammeFormFields';
import {
  DeliveryProgrammeFormFields,
  emptyForm,
} from './DeliveryProgrammeFormFields';
import { usePermission } from '@backstage/plugin-permission-react';
import type { DeliveryProgramme } from '@internal/plugin-adp-common';
import { deliveryProgrammeUpdatePermission } from '@internal/plugin-adp-common';
import type { SubmitResult } from '../../utils';
import {
  DialogForm,
  TitleWithHelp,
  populate,
  readValidationError,
} from '../../utils';
import { deliveryProgrammeApiRef } from './api';

export type EditDeliveryProgrammeButtonProps = Readonly<
  Omit<Parameters<typeof Button>[0], 'onClick'> & {
    deliveryProgramme: DeliveryProgramme;
    onEdited?: () => void;
  }
>;

export function EditDeliveryProgrammeButton({
  onEdited,
  deliveryProgramme,
  children,
  ...buttonProps
}: EditDeliveryProgrammeButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const alertApi = useApi(alertApiRef);
  const client = useApi(deliveryProgrammeApiRef);

  const { allowed: allowedToEditDeliveryProgramme } = usePermission({
    permission: deliveryProgrammeUpdatePermission,
    resourceRef: deliveryProgramme.id,
  });
  if (!allowedToEditDeliveryProgramme) return null;

  async function handleSubmit(
    fields: DeliveryProgrammeFields,
  ): Promise<SubmitResult<DeliveryProgrammeFields>> {
    try {
      await client.updateDeliveryProgramme({
        ...fields,
        id: deliveryProgramme.id,
      });
    } catch (e: any) {
      return readValidationError(e);
    }
    alertApi.post({
      message: 'Delivery Programme updated successfully.',
      severity: 'success',
      display: 'transient',
    });
    return { type: 'success' };
  }

  return (
    <>
      <Button
        data-testid="edit-delivery-programme-button"
        {...buttonProps}
        onClick={() => setIsModalOpen(true)}
      >
        {children}
      </Button>
      {isModalOpen && (
        <DialogForm
          defaultValues={populate(emptyForm, deliveryProgramme)}
          renderFields={DeliveryProgrammeFormFields}
          completed={success => {
            setIsModalOpen(false);
            if (success) onEdited?.();
          }}
          title={
            <TitleWithHelp href="https://defra.github.io/adp-documentation/Getting-Started/onboarding-a-delivery-programme/">
              {`Update Delivery Programme ${deliveryProgramme.title}`}
            </TitleWithHelp>
          }
          confirm="Update"
          submit={handleSubmit}
        />
      )}
    </>
  );
}
