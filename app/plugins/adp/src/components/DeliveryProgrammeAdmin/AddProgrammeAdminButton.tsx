import React, { useState } from 'react';
import { Button } from '@material-ui/core';
import type { SubmitResult } from '../../utils';
import { DialogForm, readValidationError } from '../../utils';
import type { DeliveryProgrammeAdminFields } from './DeliveryProgrammeAdminFormFields';
import {
  DeliveryProgrammeAdminFormFields,
  emptyForm,
} from './DeliveryProgrammeAdminFormFields';
import { alertApiRef, useApi } from '@backstage/core-plugin-api';
import { deliveryProgrammeAdminApiRef } from './api';
import { usePermission } from '@backstage/plugin-permission-react';
import { deliveryProgrammeAdminCreatePermission } from '@internal/plugin-adp-common';

export type AddProgrammeAdminButtonProps = Readonly<
  Omit<Parameters<typeof Button>[0], 'onClick'> & {
    onCreated?: () => void;
    deliveryProgrammeId: string;
    entityRef: string;
  }
>;

export function AddProgrammeAdminButton({
  onCreated,
  deliveryProgrammeId,
  entityRef,
  children,
  ...buttonProps
}: AddProgrammeAdminButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const alertApi = useApi(alertApiRef);
  const client = useApi(deliveryProgrammeAdminApiRef);
  const { allowed: canCreateProgrammeAdmin } = usePermission({
    permission: deliveryProgrammeAdminCreatePermission,
    resourceRef: entityRef,
  });

  if (!canCreateProgrammeAdmin) return null;

  async function handleSubmit(
    fields: DeliveryProgrammeAdminFields,
  ): Promise<SubmitResult<DeliveryProgrammeAdminFields>> {
    const userCatalogNameValue = fields.user_catalog_name.map(x => x.value);
    try {
      const promises = userCatalogNameValue.map(async value => {
        await client.create(deliveryProgrammeId, value, entityRef);
      });
      await Promise.all(promises);
    } catch (e: any) {
      return readValidationError(e);
    }
    alertApi.post({
      message: 'Delivery Programme Admin added successfully',
      severity: 'success',
      display: 'transient',
    });
    return { type: 'success' };
  }

  return (
    <>
      <Button
        {...buttonProps}
        onClick={() => setIsModalOpen(true)}
        data-testid="add-programme-admin-button"
      >
        {children}
      </Button>

      {isModalOpen && (
        <DialogForm
          defaultValues={emptyForm}
          renderFields={DeliveryProgrammeAdminFormFields}
          completed={success => {
            setIsModalOpen(false);
            if (success) onCreated?.();
          }}
          title="Add Delivery Programme Admin"
          confirm="Add"
          submit={handleSubmit}
        />
      )}
    </>
  );
}
