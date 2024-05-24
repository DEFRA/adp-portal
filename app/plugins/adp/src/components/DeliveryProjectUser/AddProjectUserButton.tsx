import { Button } from '@material-ui/core';
import React, { useState } from 'react';
import { deliveryProjectUserApiRef } from './api';
import { alertApiRef, useApi } from '@backstage/core-plugin-api';
import {
  DeliveryProjectUserFormFields,
  emptyForm,
  type DeliveryProjectUserFields,
} from './DeliveryProjectUserFormFields';
import { DialogForm, readValidationError } from '../../utils';
import type { SubmitResult } from '../../utils';

export type AddProjectUserButtonProps = Readonly<
  Omit<Parameters<typeof Button>[0], 'onClick'> & {
    onCreated?: () => void;
    deliveryProjectId: string;
  }
>;

export function AddProjectUserButton({
  onCreated,
  deliveryProjectId,
  children,
  ...buttonProps
}: AddProjectUserButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const alertApi = useApi(alertApiRef);
  const client = useApi(deliveryProjectUserApiRef);

  async function handleSubmit(
    fields: DeliveryProjectUserFields,
  ): Promise<SubmitResult<DeliveryProjectUserFields>> {
    try {
      await client.create({
        delivery_project_id: deliveryProjectId,
        ...fields,
      });
    } catch (e: any) {
      return readValidationError(e);
    }
    alertApi.post({
      message: 'Delivery Project User added successfully',
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
        data-testid="add-project-user-button"
      >
        {children}
      </Button>
      {isModalOpen && (
        <DialogForm
          defaultValues={emptyForm}
          renderFields={DeliveryProjectUserFormFields}
          completed={success => {
            setIsModalOpen(false);
            if (success) onCreated?.();
          }}
          title="Add Team Member"
          confirm="Add"
          submit={handleSubmit}
        />
      )}
    </>
  );
}
