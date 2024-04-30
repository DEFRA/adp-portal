import React, { useState } from 'react';
import { Button } from '@material-ui/core';
import {
  alertApiRef,
  discoveryApiRef,
  fetchApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import { ArmsLengthBodyClient } from './api/AlbClient';
import { AlbFields, AlbFormFields } from './AlbFormFields';
import { usePermission } from '@backstage/plugin-permission-react';
import {
  ArmsLengthBody,
  adpProgrammmeCreatePermission,
} from '@internal/plugin-adp-common';
import { DialogForm, SubmitResult, albUtil } from '../../utils';

export type EditAlbProps = Readonly<
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
}: EditAlbProps) {
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
      await client.updateArmsLengthBody({
        ...armsLengthBody,
        ...fields,
      });
    } catch (e: any) {
      return albUtil.readValidationError(e, fields);
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
          defaultValues={armsLengthBody}
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
