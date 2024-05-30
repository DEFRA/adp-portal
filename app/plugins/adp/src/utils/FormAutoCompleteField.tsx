import React from 'react';
import { TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import type {
  Control,
  FieldErrors,
  FieldPath,
  FieldPathValue,
  FieldValues,
  UseControllerProps,
} from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { isFieldDisabled } from './isFieldDisabled';
import { isFieldMultiselect } from './isFieldMultiSelect';
import { enrichHelperText } from './enrichHelperText';
import { rulesToHtmlProperties } from './rulesToHtmlProperties';

export type FormAutoCompleteFieldProps<
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
  multiple?: boolean | Partial<Record<FieldPath<TFields>, boolean>>;
  options: Array<{
    label: string;
    value: FieldPathValue<TFields, TName>;
  }>;
  disabled?: boolean | Partial<Record<FieldPath<TFields>, boolean>>;
}>;

export function FormAutoCompleteField<
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
  multiple,
}: FormAutoCompleteFieldProps<TFields, TName>) {
  return (
    <Controller<TFields, TName>
      control={control}
      name={name}
      key={`${name}-${index}`}
      rules={rules}
      render={({ field }) => (
        <Autocomplete
          {...field}
          multiple={isFieldMultiselect(multiple, name)}
          id={name}
          key={`${name}-${index}`}
          options={options}
          getOptionLabel={option => option.label}
          renderInput={params => (
            <TextField
              {...params}
              variant="standard"
              fullWidth
              label={label}
              error={!!errors[name]}
              helperText={
                errors[name]?.message ??
                enrichHelperText(helperText, rules) ??
                ' '
              }
              disabled={isFieldDisabled(disabled, name)}
              data-testid={name}
              inputProps={{
                ...rulesToHtmlProperties(rules),
              }}
            />
          )}
        />
      )}
    />
  );
}
