import React, { FC } from 'react';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
} from '@material-ui/core';
import { Controller, useForm, useFormContext } from 'react-hook-form';

import SelectedChipsRenderer from './SelectedChipsRenderer';
import { alertApiRef, useApi } from '@backstage/core-plugin-api';

export interface ActionsModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  transformedData?: (data: any) => Promise<void>;
  initialValues: Record<string, any>;
  mode: 'create' | 'edit';
  fields: {
    label: string;
    name: string;
    helperText?: string;
    validations?: {
      required?: boolean;
      maxLength?: number;
      pattern?: {
        value: RegExp;
        message: string;
      };
    };
    multiline?: boolean;
    maxRows?: number;
    select?: boolean;
    multiple?: boolean;
    options?: { label: string; value: string }[];
    disabled?: boolean;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  }[];
}

export const ActionsModal: FC<ActionsModalProps> = ({
  open,
  onClose,
  onSubmit,
  transformedData,
  initialValues,
  mode,
  fields,
}) => {
  const formContext = useFormContext();
  const formMethods = formContext || useForm({ defaultValues: initialValues });
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = formMethods;
  const errorApi = useApi(alertApiRef);

  const onFormSubmit = async (data: any) => {
    const finalData = transformedData ? await transformedData(data) : data;
    try {
      await onSubmit(finalData);
      reset();
      onClose();
    } catch (e: any) {
      errorApi.post(e);
    }
  };

  const renderTextField = (txtField: any) => (
    <Controller
      name={txtField.name}
      control={control}
      defaultValue={initialValues[txtField.name] || ''}
      rules={{
        required: txtField.validations?.required
          ? 'This field is required'
          : undefined,
        maxLength: txtField.validations?.maxLength
          ? {
              value: txtField.validations.maxLength,
              message: `Maximum length is ${txtField.validations.maxLength} characters`,
            }
          : undefined,
        pattern: txtField.validations?.pattern
          ? {
              value: txtField.validations.pattern.value,
              message: txtField.validations.pattern.message,
            }
          : undefined,
      }}
      render={({ field }) => (
        <TextField
          key={txtField.name}
          id={txtField.name}
          label={txtField.label}
          variant="outlined"
          fullWidth
          margin="dense"
          {...field}
          error={!!errors[txtField.name]}
          helperText={errors[txtField.name]?.message ?? txtField.helperText}
          multiline={txtField.multiline}
          maxRows={txtField.maxRows}
          data-testid={txtField.name}
          onChange={e => {
            field.onChange(e);
            if (txtField.onChange) {
              txtField.onChange(e);
            }
          }}
          disabled={txtField.disabled}
        />
      )}
    />
  );

  const renderSelectField = (field: any) => (
    <TextField
      key={field.name}
      id={field.name}
      label={field.label}
      variant="outlined"
      fullWidth
      margin="dense"
      select
      SelectProps={{
        multiple: field.multiple,
        renderValue: field.multiple
          ? selected => (
              <SelectedChipsRenderer
                selected={selected || []}
                options={field.options}
              />
            )
          : undefined,
      }}
      {...register(field.name, {
        required: field.validations?.required
          ? 'This field is required'
          : undefined,
        maxLength: field.validations?.maxLength
          ? {
              value: field.validations.maxLength,
              message: `Maximum length is ${field.validations.maxLength} characters`,
            }
          : undefined,
        pattern: field.validations?.pattern
          ? {
              value: field.validations.pattern.value,
              message: field.validations.pattern.message,
            }
          : undefined,
      })}
      defaultValue={
        field.multiple
          ? Array.isArray(initialValues[field.name])
            ? initialValues[field.name].map(
                (item: any) => item.aad_entity_ref_id,
              )
            : []
          : initialValues[field.name] || ''
      }
      disabled={field.disabled}
      error={!!errors[field.name]}
      helperText={errors[field.name]?.message ?? field.helperText}
      data-testid={field.name}
      onChange={field.onChange}
    >
      {field.options?.map((option: any) => (
        <MenuItem
          key={option.value}
          value={option.value}
          data-testid={'select-option-' + field.name + '-' + option.value}
        >
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );

  return (
    <Dialog
      open={open}
      onClose={() => {
        reset(initialValues);
        onClose();
      }}
    >
      <DialogTitle>{`${mode === 'edit' ? 'Edit' : 'Create'}: ${
        initialValues.title || ''
      }`}</DialogTitle>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <DialogContent>
          {fields.map(field =>
            field.select ? renderSelectField(field) : renderTextField(field),
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              reset(initialValues);
              onClose();
            }}
            color="primary"
            data-testid="actions-modal-cancel-button"
          >
            Cancel
          </Button>
          {mode === 'edit' ? (
            <Button
              type="submit"
              color="primary"
              data-testid="actions-modal-update-button"
            >
              Update
            </Button>
          ) : (
            <Button
              type="submit"
              color="primary"
              data-testid="actions-modal-update-button"
            >
              Create
            </Button>
          )}
        </DialogActions>
      </form>
    </Dialog>
  );
};
