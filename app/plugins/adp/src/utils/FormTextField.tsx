import React from 'react';
import { type InputProps, TextField } from '@material-ui/core';
import type {
  Control,
  FieldErrors,
  FieldPath,
  FieldValues,
  UseControllerProps,
} from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { isFieldDisabled } from './isFieldDisabled';
import { enrichHelperText } from './enrichHelperText';
import { rulesToHtmlProperties } from './rulesToHtmlProperties';

export type FormTextFieldProps<
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
  maxRows?: number;
  disabled?: boolean | Partial<Record<FieldPath<TFields>, boolean>>;
  InputProps?: InputProps;
}>;

export function FormTextField<
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
  maxRows,
  disabled,
  InputProps,
}: FormTextFieldProps<TFields, TName>) {
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
          InputProps={InputProps}
          {...field}
          error={!!errors[name]}
          helperText={
            errors[name]?.message ?? enrichHelperText(helperText, rules) ?? ' '
          }
          multiline={!!maxRows && maxRows > 1}
          maxRows={maxRows}
          data-testid={name}
          disabled={isFieldDisabled(disabled, name)}
          inputProps={{
            ...rulesToHtmlProperties(rules),
          }}
        />
      )}
    />
  );
}
