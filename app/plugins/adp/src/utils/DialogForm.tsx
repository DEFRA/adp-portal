import React, { ReactNode, useState } from 'react';

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@material-ui/core';
import {
  FieldPath,
  FieldValues,
  UseFormProps,
  UseFormReturn,
  useForm,
} from 'react-hook-form';
import { alertApiRef, useApi } from '@backstage/core-plugin-api';
import { DisabledFields } from './isFieldDisabled';
import { ValidationError } from '@internal/plugin-adp-common';

export type ValidateResult<TForm extends FieldValues> = Array<
  ValidationError<FieldPath<TForm> | 'root' | `root.${string}`>
>;

export type SubmitResult<TForm extends FieldValues> =
  | { type: 'success' }
  | { type: 'validationError'; errors: ValidateResult<TForm> };

export type DialogFormFieldsProps<TFields extends FieldValues> = Readonly<
  {
    disabled: DisabledFields<TFields>;
  } & UseFormReturn<TFields>
>;

export type EachRequired<T> = T extends any
  ? {
      [P in keyof Required<T>]: T[P];
    }
  : never;

export type DialogFormProps<TFields extends FieldValues> = Readonly<{
  title: ReactNode;
  open?: boolean;
  completed: (form: TFields | undefined) => void;
  renderFields: (props: DialogFormFieldsProps<TFields>) => ReactNode;
  confirm?: ReactNode;
  cancel?: ReactNode;
  defaultValues: UseFormProps<TFields>['defaultValues'];
  disabled?: DisabledFields<TFields>;
  validate?: (
    form: TFields,
  ) => ValidateResult<TFields> | Promise<ValidateResult<TFields>>;
  submit: (
    form: TFields,
  ) => SubmitResult<TFields> | Promise<SubmitResult<TFields>>;
}>;

export function DialogForm<TFields extends FieldValues>({
  defaultValues,
  open = true,
  title,
  disabled,
  renderFields,
  validate = () => [],
  submit,
  completed,
  confirm = 'Continue',
  cancel = 'Cancel',
}: DialogFormProps<TFields>) {
  const errorApi = useApi(alertApiRef);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const form = useForm<TFields>({
    defaultValues,
  });
  const { setError, clearErrors, handleSubmit, reset } = form;

  if (!open) return null;

  function setErrors(errors: ValidateResult<TFields>) {
    for (const error of errors) setError(error.path, error.error);
  }

  async function onSubmit(fields: TFields) {
    setSubmitting(true);
    try {
      clearErrors();
      const validationErrors = await validate(fields);
      setErrors(validationErrors);
      if (validationErrors.length > 0) return;

      const submitResult = await submit(fields);
      if (submitResult.type == 'validationError')
        setErrors(submitResult.errors);
      else handleComplete(fields);
    } catch (err) {
      errorApi.post({
        message: String(err),
        severity: 'error',
        display: 'transient',
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handleComplete(value: TFields | undefined) {
    reset();
    completed(value);
  }

  return (
    <Dialog open>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          {renderFields({ ...form, disabled: submitting || disabled })}
        </DialogContent>
        <DialogActions>
          <Button
            disabled={submitting}
            color="primary"
            data-testid="actions-modal-cancel-button"
            onClick={() => handleComplete(undefined)}
          >
            {cancel}
          </Button>
          <Button
            disabled={submitting}
            type="submit"
            color="primary"
            data-testid="actions-modal-submit-button"
          >
            {confirm}
          </Button>
          <Box sx={{ marginX: '0.5rem', minWidth: '1rem' }}>
            {submitting && <CircularProgress size="1rem" />}
          </Box>
        </DialogActions>
      </form>
    </Dialog>
  );
}
