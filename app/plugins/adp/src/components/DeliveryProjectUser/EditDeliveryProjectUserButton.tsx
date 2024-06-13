import { alertApiRef, useApi } from '@backstage/core-plugin-api';
import {
  deliveryProjectUserUpdatePermission,
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
import {
  DialogForm,
  TitleWithHelp,
  populate,
  readValidationError,
} from '../../utils';
import { usePermission } from '@backstage/plugin-permission-react';

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
  const { allowed: canEditProjectUser } = usePermission({
    permission: deliveryProjectUserUpdatePermission,
    resourceRef: deliveryProjectUser.delivery_project_id,
  });

  if (!canEditProjectUser) return null;

  const userEntityRef = normalizeUsername(deliveryProjectUser.email);

  async function handleSubmit(
    fields: DeliveryProjectUserFields,
  ): Promise<SubmitResult<DeliveryProjectUserFields>> {
    try {
      await client.update({
        ...deliveryProjectUser,
        ...fields,
        aad_user_principal_name:
          deliveryProjectUser.aad_user_principal_name ?? '',
        user_catalog_name: fields.user_catalog_name.value,
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
            user_catalog_name: {
              label: deliveryProjectUser.name,
              value: userEntityRef,
            },
          })}
          renderFields={DeliveryProjectUserFormFields}
          completed={success => {
            setIsModalOpen(false);
            if (success) onEdited?.();
          }}
          title={
            <TitleWithHelp href="https://defra.github.io/adp-documentation/Getting-Started/onboarding-a-user/">
              {`Edit team member ${deliveryProjectUser.name}`}
            </TitleWithHelp>
          }
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
