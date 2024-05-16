import { alertApiRef, useApi } from '@backstage/core-plugin-api';
import {
  normalizeUsername,
  type DeliveryProjectUser,
} from '@internal/plugin-adp-common';
import { Button } from '@material-ui/core';
import React, { useState } from 'react';
import { deliveryProjectUserApiRef } from './api';
import type { DeliveryProjectUserFields } from './DeliveryProjectUserFormFields';
import {
  DeliveryProjectUserFormFields,
  emptyForm,
} from './DeliveryProjectUserFormFields';
import type { SubmitResult } from '../../utils';
import { DialogForm, populate, readValidationError } from '../../utils';

export type EditDeliveryProjectUserButtonProps = Readonly<
  Omit<Parameters<typeof Button>[0], 'onClick'> & {
    deliveryProjectUser: DeliveryProjectUser;
    onEdited?: () => void;
  }
>;

export function EditDeliveryProjectUserButton({
  onEdited,
  deliveryProjectUser,
  children,
  ...buttonProps
}: EditDeliveryProjectUserButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const alertApi = useApi(alertApiRef);
  const client = useApi(deliveryProjectUserApiRef);

  const userEntityRef = normalizeUsername(deliveryProjectUser.email);

  async function handleSubmit(
    fields: DeliveryProjectUserFields,
  ): Promise<SubmitResult<DeliveryProjectUserFields>> {
    try {
      await client.update({
        ...deliveryProjectUser,
        ...fields,
      });
    } catch (e: any) {
      return readValidationError(e);
    }
    alertApi.post({
      message: 'Delivery Project User updated successfully.',
      severity: 'success',
      display: 'transient',
    });
    return { type: 'success' };
  }

  return (
    <>
      <Button
        data-testid="edit-delivery-project-user-button"
        {...buttonProps}
        onClick={() => setIsModalOpen(true)}
      >
        {children}
      </Button>
      {isModalOpen && (
        <DialogForm
          defaultValues={populate(emptyForm, {
            ...deliveryProjectUser,
            user_catalog_name: userEntityRef,
          })}
          renderFields={DeliveryProjectUserFormFields}
          completed={success => {
            setIsModalOpen(false);
            if (success) onEdited?.();
          }}
          title={`Edit team member ${deliveryProjectUser.name}`}
          confirm="Update"
          submit={handleSubmit}
          disabled={{
            user_catalog_name: true,
          }}
        />
      )}
    </>
  );
}
