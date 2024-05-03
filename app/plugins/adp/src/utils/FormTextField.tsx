import React from 'react';
import { InputProps, TextField } from '@material-ui/core';
import { enrichHelperText } from '.';
import {
  Control,
  Controller,
  FieldErrors,
  FieldPath,
  FieldValues,
  UseControllerProps,
  ValidationRule,
  ValidationValue,
} from 'react-hook-form';
import { isFieldDisabled } from './isFieldDisabled';

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
            'aria-required': getValidationRule(rules?.required)
              ? true
              : undefined,
            maxLength: getValidationRule(rules?.maxLength),
          }}
        />
      )}
    />
  );
}

function getValidationRule<T extends ValidationValue>(
  rule?: ValidationRule<T>,
) {
  switch (typeof rule) {
    case 'undefined':
      return undefined;
    case 'object':
      if (rule instanceof RegExp) return rule as T;
      return rule.value;
    default:
      return rule;
  }
}
