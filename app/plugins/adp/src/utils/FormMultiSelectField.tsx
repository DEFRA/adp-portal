import React from 'react';
import { MenuItem, TextField } from '@material-ui/core';
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
import SelectedChipsRenderer from './SelectedChipsRenderer';
import { enrichHelperText } from './enrichHelperText';
import { rulesToHtmlProperties } from './rulesToHtmlProperties';

export type FormMultiSelectFieldProps<
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
    value: FieldPathValue<TFields, TName> extends ReadonlyArray<infer Elem>
      ? Elem
      : never;
  }>;
  disabled?: boolean | Partial<Record<FieldPath<TFields>, boolean>>;
}>;

export function FormMultiSelectField<
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
}: FormMultiSelectFieldProps<TFields, TName>) {
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
          SelectProps={{
            multiple: true,
            renderValue: value => (
              <SelectedChipsRenderer selected={value || []} options={options} />
            ),
          }}
          {...field}
          error={!!errors[name]}
          helperText={
            errors[name]?.message ?? enrichHelperText(helperText, rules) ?? ' '
          }
          data-testid={name}
          disabled={isFieldDisabled(disabled, name)}
          inputProps={{
            ...rulesToHtmlProperties(rules),
          }}
        >
          {ensureSelectionsNotMissing(options, field.value).map(x => (
            <MenuItem
              key={String(x.value)}
              value={x.value as string}
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

const empty: unknown[] = [null, undefined, ''];
function ensureSelectionsNotMissing<T>(
  options: ReadonlyArray<{ label: string; value: T }>,
  values: readonly T[],
) {
  const available = new Set(options.map(x => x.value));
  const missing = values.filter(v => !empty.includes(v) && !available.has(v));
  if (missing.length) return options;

  return [
    ...options,
    ...missing.map(value => ({ label: String(value), value })),
  ];
}
