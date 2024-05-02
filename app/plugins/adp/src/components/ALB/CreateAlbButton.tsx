import React, { useState } from 'react';
import { Button } from '@material-ui/core';
import { alertApiRef, useApi } from '@backstage/core-plugin-api';
import { AlbFields, AlbFormFields, emptyForm } from './AlbFormFields';
import { usePermission } from '@backstage/plugin-permission-react';
import { adpProgrammmeCreatePermission } from '@internal/plugin-adp-common';
import { DialogForm, SubmitResult, readValidationError } from '../../utils';
import { armsLengthBodyApiRef } from './api';

export type CreateAlbButtonProps = Readonly<
  Omit<Parameters<typeof Button>[0], 'onClick'> & {
    onCreated?: () => void;
  }
>;

export function CreateAlbButton({
  onCreated,
  children,
  ...buttonProps
}: CreateAlbButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const alertApi = useApi(alertApiRef);
  const client = useApi(armsLengthBodyApiRef);

  const { allowed: allowedToCreateAlb } = usePermission({
    permission: adpProgrammmeCreatePermission,
  });
  if (!allowedToCreateAlb) return null;

  async function handleSubmit(
    fields: AlbFields,
  ): Promise<SubmitResult<AlbFields>> {
    try {
      await client.createArmsLengthBody(fields);
    } catch (e: any) {
      return readValidationError(e);
    }
    alertApi.post({
      message: 'ALB created successfully.',
      severity: 'success',
      display: 'transient',
    });
    return { type: 'success' };
  }

  return (
    <>
      <Button
        data-testid="create-alb-button"
        {...buttonProps}
        onClick={() => setIsModalOpen(true)}
      >
        {children}
      </Button>
      {isModalOpen && (
        <DialogForm
          defaultValues={emptyForm}
          renderFields={AlbFormFields}
          completed={success => {
            setIsModalOpen(false);
            if (success) onCreated?.();
          }}
          title="Create a new Arms Length Body"
          confirm="Create"
          submit={handleSubmit}
        />
      )}
    </>
  );
}
