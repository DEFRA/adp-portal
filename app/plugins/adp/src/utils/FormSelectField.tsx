import React from 'react';
import { MenuItem, TextField } from '@material-ui/core';
import type {
  Control,
  FieldErrors,
  FieldPath,
  FieldPathValue,
  FieldValues,
  UseControllerProps} from 'react-hook-form';
import {
  Controller
} from 'react-hook-form';
import { isFieldDisabled } from './isFieldDisabled';
import { enrichHelperText } from './enrichHelperText';

export type FormSelectFieldProps<
  TFields extends FieldValues,
  TName extends FieldPath<TFields>,
> = Readonly<{
  control: Control<TFields>;
  errors: FieldErrors<TFields>;
  name: TName;
  index: number;
  rules?: UseControllerProps<TFields, TName>['rules'];
  label: string;
  helperText?: string;
  options: ReadonlyArray<{
    label: string;
    value: FieldPathValue<TFields, TName>;
  }>;
  disabled?: boolean | Partial<Record<FieldPath<TFields>, boolean>>;
}>;

export function FormSelectField<
  TFields extends FieldValues,
  TName extends FieldPath<TFields>,
>({
  control,
  errors,
  name,
  index,
  rules,
  label,
  helperText,
  disabled,
  options,
}: FormSelectFieldProps<TFields, TName>) {
  return (
    <Controller<TFields, TName>
      control={control}
      name={name}
      key={`${name}-${index}`}
      rules={rules}
      render={({ field }) => (
        <TextField
          key={`${name}-${index}`}
          id={name}
          label={label}
          variant="outlined"
          fullWidth
          margin="dense"
          select
          {...field}
          error={!!errors[name]}
          helperText={
            errors[name]?.message ?? enrichHelperText(helperText, rules) ?? ' '
          }
          data-testid={name}
          disabled={isFieldDisabled(disabled, name)}
        >
          {options.map(x => (
            <MenuItem
              key={String(x.value)}
              value={x.value}
              data-testid={`select-option-${x.label}`}
            >
              {x.label}
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  );
}
