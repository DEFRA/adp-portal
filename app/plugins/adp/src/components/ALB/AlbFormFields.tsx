import React from 'react';
import { DisabledFields, FormTextField, formRules } from '../../utils';
import { UseFormReturn } from 'react-hook-form';

export type AlbFields = {
  title: string;
  alias: string;
  url: string;
  description: string;
};

export type AlbFormFieldsProps = Readonly<
  UseFormReturn<AlbFields> & {
    disabled?: DisabledFields<AlbFields>;
  }
>;
export const emptyForm = Object.freeze<AlbFields>({
  alias: '',
  description: '',
  title: '',
  url: '',
});

export function AlbFormFields({
  control,
  formState: { errors },
  disabled,
}: AlbFormFieldsProps) {
  let i = 0;
  return (
    <>
      <FormTextField
        control={control}
        errors={errors}
        index={i++}
        name="title"
        label="Name"
        helperText="This must be unique"
        disabled={disabled}
        rules={{
          ...formRules.required,
          ...formRules.maxLength(100),
        }}
      />

      <FormTextField
        control={control}
        errors={errors}
        index={i++}
        name="alias"
        label="Alias"
        helperText="Are there any other names this Arms Length Body is also known as?"
        disabled={disabled}
      />

      <FormTextField
        control={control}
        errors={errors}
        index={i++}
        name="url"
        label="Website"
        helperText="A link to a website"
        disabled={disabled}
        rules={{
          ...formRules.pattern(/^https?:\/\//, 'Invalid url format'),
        }}
      />

      <FormTextField
        control={control}
        errors={errors}
        index={i++}
        name="description"
        label="Description"
        helperText="Max 200 characters"
        disabled={disabled}
        maxRows={4}
        rules={{
          ...formRules.required,
          ...formRules.maxLength(200),
        }}
      />
    </>
  );
}
