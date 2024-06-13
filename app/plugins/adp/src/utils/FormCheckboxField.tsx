import { Checkbox, FormControlLabel, FormHelperText } from '@material-ui/core';
import React from 'react';
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

export type FormCheckboxFieldProps<
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
}>;

export function FormCheckboxField<
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
}: FormCheckboxFieldProps<TFields, TName>) {
  return (
    <>
      <Controller<TFields, TName>
        control={control}
        name={name}
        key={`${name}-${index}`}
        rules={rules}
        render={({ field }) => (
          <FormControlLabel
            control={
              <Checkbox
                key={`${name}-${index}`}
                id={name}
                {...field}
                disabled={isFieldDisabled(disabled, name)}
                color="primary"
                inputProps={{
                  ...rulesToHtmlProperties(rules),
                }}
                checked={field.value === true}
              />
            }
            label={label}
          />
        )}
      />
      <FormHelperText>
        {getHelperText(errors, name, helperText, rules)}
      </FormHelperText>
    </>
  );
}
