import React, { useState } from 'react';
import { Button } from '@material-ui/core';
import { alertApiRef, useApi } from '@backstage/core-plugin-api';
import type { AlbFields } from './AlbFormFields';
import { AlbFormFields, emptyForm } from './AlbFormFields';
import { usePermission } from '@backstage/plugin-permission-react';
import type { ArmsLengthBody } from '@internal/plugin-adp-common';
import { armsLengthBodyUpdatePermission } from '@internal/plugin-adp-common';
import type { SubmitResult } from '../../utils';
import { DialogForm, populate, readValidationError } from '../../utils';
import { armsLengthBodyApiRef } from './api';

export type EditAlbButtonProps = Readonly<
  Omit<Parameters<typeof Button>[0], 'onClick'> & {
    armsLengthBody: ArmsLengthBody;
    onEdited?: () => void;
  }
>;

export function EditAlbButton({
  onEdited,
  armsLengthBody,
  children,
  ...buttonProps
}: EditAlbButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const alertApi = useApi(alertApiRef);
  const client = useApi(armsLengthBodyApiRef);

  const { allowed: canEditArmsLengthBody } = usePermission({
    permission: armsLengthBodyUpdatePermission,
    resourceRef: armsLengthBody.id,
  });
  if (!canEditArmsLengthBody) return null;

  async function handleSubmit(
    fields: AlbFields,
  ): Promise<SubmitResult<AlbFields>> {
    try {
      await client.updateArmsLengthBody({
        ...fields,
        id: armsLengthBody.id,
      });
    } catch (e: any) {
      return readValidationError(e);
    }
    alertApi.post({
      message: 'ALB edited successfully.',
      severity: 'success',
      display: 'transient',
    });
    return { type: 'success' };
  }

  return (
    <>
      <Button
        data-testid="alb-edit-button"
        {...buttonProps}
        onClick={() => setIsModalOpen(true)}
      >
        {children}
      </Button>
      {isModalOpen && (
        <DialogForm
          renderFields={AlbFormFields}
          defaultValues={populate(emptyForm, armsLengthBody)}
          completed={form => {
            setIsModalOpen(false);
            if (form) onEdited?.();
          }}
          title={`Update ALB ${armsLengthBody.title}`}
          confirm="Update"
          submit={handleSubmit}
        />
      )}
    </>
  );
}
