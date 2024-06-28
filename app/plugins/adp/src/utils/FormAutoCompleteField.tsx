import React, { useCallback, useEffect, useState } from 'react';
import { CircularProgress, TextField } from '@material-ui/core';
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
  getOptions: (input: string) => Promise<
    Array<{
      label: string;
      value: string;
    }>
  >;
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
  getOptions,
}: FormAutoCompleteFieldProps<TFields, TName>) {
  const [options, setOptions] = useState(
    [] as Array<{
      label: string;
      value: string;
    }>,
  );
  const [loading, setLoading] = useState(false);
  const [filterText, setFilterText] = useState('');

  const optionsCallback = useCallback(
    (
      values: Array<{
        label: string;
        value: string;
      }>,
    ) => {
      setOptions(values);
      setLoading(false);
    },
    [setOptions, setLoading],
  );

  useEffect(() => {
    let isMounted = true;
    if (isMounted) {
      setLoading(true);
      getOptions(filterText)
        .then(optionsCallback)
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [filterText, getOptions, optionsCallback]);

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
          getOptionLabel={option => {
            return option.label || '';
          }}
          getOptionSelected={(option, selectedOption) => {
            return selectedOption.value === option.value;
          }}
          disabled={isFieldDisabled(disabled, name)}
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
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <React.Fragment>
                    {loading ? (
                      <CircularProgress color="inherit" size={20} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </React.Fragment>
                ),
              }}
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
          onInputChange={(_, value) => {
            setFilterText(value);
          }}
        />
      )}
    />
  );
}
