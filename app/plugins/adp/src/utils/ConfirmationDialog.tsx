import { alertApiRef, useApi } from '@backstage/core-plugin-api';
import type { PropTypes } from '@material-ui/core';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@material-ui/core';
import React, { useState } from 'react';
import type { ReactNode } from 'react';

export type ConfirmationDialogProps = Readonly<{
  title: ReactNode;
  content: ReactNode;
  open?: boolean;
  confirm?: ReactNode;
  cancel?: ReactNode;
  confirmColour?: PropTypes.Color;
  submit: () => Promise<void> | void;
  completed: (submitted: boolean | undefined) => void;
}>;

export function ConfirmationDialog({
  title,
  content,
  open = true,
  confirm = 'Continue',
  cancel = 'Cancel',
  confirmColour = 'primary',
  submit,
  completed,
}: ConfirmationDialogProps) {
  const alertApi = useApi(alertApiRef);
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!open) return null;

  async function handleConfirm() {
    setSubmitting(true);
    try {
      await submit();
      handleComplete(true);
    } catch (err) {
      alertApi.post({
        message: String(err),
        severity: 'error',
        display: 'transient',
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handleComplete(submitted: boolean | undefined) {
    completed(submitted);
  }

  return (
    <Dialog open>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{content}</DialogContent>
      <DialogActions>
        <Button
          disabled={submitting}
          color="primary"
          data-testid="confirmation-modal-cancel-button"
          onClick={() => handleComplete(undefined)}
        >
          {cancel}
        </Button>
        <Button
          disabled={submitting}
          color={confirmColour}
          data-testid="confirmation-modal-confirm-button"
          onClick={() => handleConfirm()}
        >
          {confirm}
        </Button>
        <Box sx={{ marginX: '0.5rem', minWidth: '1rem' }}>
          {submitting && <CircularProgress size="1rem" />}
        </Box>
      </DialogActions>
    </Dialog>
  );
}
