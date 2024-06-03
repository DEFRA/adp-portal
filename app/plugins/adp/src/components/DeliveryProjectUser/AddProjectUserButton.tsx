import { Button } from '@material-ui/core';
import React, { useState } from 'react';
import { deliveryProjectUserApiRef } from './api';
import { alertApiRef, useApi } from '@backstage/core-plugin-api';
import {
  DeliveryProjectUserFormFields,
  emptyForm,
  type DeliveryProjectUserFields,
} from './DeliveryProjectUserFormFields';
import { DialogForm, TitleWithHelp, readValidationError } from '../../utils';
import type { SubmitResult } from '../../utils';
import { usePermission } from '@backstage/plugin-permission-react';
import { deliveryProjectUserCreatePermission } from '@internal/plugin-adp-common';

export type AddProjectUserButtonProps = Readonly<
  Omit<Parameters<typeof Button>[0], 'onClick'> & {
    onCreated?: () => void;
    deliveryProjectId: string;
    entityRef: string;
  }
>;

export function AddProjectUserButton({
  onCreated,
  deliveryProjectId,
  entityRef,
  children,
  ...buttonProps
}: AddProjectUserButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const alertApi = useApi(alertApiRef);
  const client = useApi(deliveryProjectUserApiRef);
  const { allowed: canCreateProjectUser } = usePermission({
    permission: deliveryProjectUserCreatePermission,
    resourceRef: deliveryProjectId,
  });

  if (!canCreateProjectUser) return null;

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
          title={
            <TitleWithHelp href="https://defra.github.io/adp-documentation/Getting-Started/onboarding-a-user/">
              Add team member
            </TitleWithHelp>
          }
          confirm="Add"
          submit={handleSubmit}
        />
      )}
    </>
  );
}
