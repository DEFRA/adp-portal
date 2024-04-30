import React, { useState } from 'react';
import { Button } from '@material-ui/core';
import {
  alertApiRef,
  discoveryApiRef,
  fetchApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import { ArmsLengthBodyClient } from './api/AlbClient';
import { AlbFields, AlbFormFields, emptyForm } from './AlbFormFields';
import { usePermission } from '@backstage/plugin-permission-react';
import { adpProgrammmeCreatePermission } from '@internal/plugin-adp-common';
import { DialogForm, SubmitResult, albUtil } from '../../utils';

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
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);

  const client = new ArmsLengthBodyClient(discoveryApi, fetchApi);

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
      return albUtil.readValidationError(e, fields);
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
