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
} from './DeliveryProgrammeFormFields';
import { usePermission } from '@backstage/plugin-permission-react';
import {
  DeliveryProgramme,
  adpProgrammmeCreatePermission,
} from '@internal/plugin-adp-common';
import { DialogForm, SubmitResult, deliveryProgrammeUtil } from '../../utils';

export type EditDeliveryProgrammeButtonProps = Readonly<
  Omit<Parameters<typeof Button>[0], 'onClick'> & {
    deliveryProgramme: DeliveryProgramme;
    onEditd?: () => void;
  }
>;

export function EditDeliveryProgrammeButton({
  onEditd,
  deliveryProgramme,
  children,
  ...buttonProps
}: EditDeliveryProgrammeButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const alertApi = useApi(alertApiRef);
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);

  const client = new DeliveryProgrammeClient(discoveryApi, fetchApi);

  const { allowed: allowedToEditDeliveryProgramme } = usePermission({
    permission: adpProgrammmeCreatePermission,
  });
  if (!allowedToEditDeliveryProgramme) return null;

  async function handleSubmit(
    fields: DeliveryProgrammeFields,
  ): Promise<SubmitResult<DeliveryProgrammeFields>> {
    try {
      await client.updateDeliveryProgramme({
        ...deliveryProgramme,
        ...fields,
      });
    } catch (e: any) {
      return deliveryProgrammeUtil.readValidationError(e, fields);
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
          defaultValues={deliveryProgramme}
          renderFields={DeliveryProgrammeFormFields}
          completed={success => {
            setIsModalOpen(false);
            if (success) onEditd?.();
          }}
          title={`Update Delivery Programme ${deliveryProgramme.title}`}
          confirm="Update"
          submit={handleSubmit}
        />
      )}
    </>
  );
}
