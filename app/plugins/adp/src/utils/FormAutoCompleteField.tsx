import React from 'react';
import { TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import type {
  Control,
  FieldErrors,
  FieldPath,
  FieldValues,
  UseControllerProps,
} from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { isFieldDisabled } from './isFieldDisabled';
import { rulesToHtmlProperties } from './rulesToHtmlProperties';
import { getHelperText } from './getHelperText';

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
  options: Array<{
    label: string;
    value: string;
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
          id={name}
          key={`${name}-${index}`}
          options={options}
          getOptionLabel={option => option.label || ''}
          getOptionSelected={(option, selectedOption) => {
            return selectedOption.value === option.value;
          }}
          renderInput={params => (
            <TextField
              {...params}
              variant="standard"
              fullWidth
              label={label}
              error={!!errors[name]}
              helperText={getHelperText(errors, name, helperText, rules)}
              disabled={isFieldDisabled(disabled, name)}
              data-testid={name}
              inputProps={{
                ...params.inputProps,
                ...rulesToHtmlProperties(rules),
              }}
            />
          )}
          onChange={(_, selectedOption) => {
            return selectedOption !== null
              ? field.onChange(selectedOption)
              : '';
          }}
        />
      )}
    />
  );
}
