import React from 'react';
import {
  DisabledFields,
  FormSelectField,
  FormTextField,
  formRules,
} from '../../utils';
import { UseFormReturn } from 'react-hook-form';
import { useArmsLengthBodyList } from '../../hooks';

export type DeliveryProgrammeFields = {
  title: string;
  alias: string;
  url: string;
  arms_length_body_id: string;
  delivery_programme_code: string;
  description: string;
};

export const emptyForm = Object.freeze<DeliveryProgrammeFields>({
  alias: '',
  arms_length_body_id: '',
  delivery_programme_code: '',
  description: '',
  title: '',
  url: '',
});

export type DeliveryProgrammeFormFieldsProps = Readonly<
  UseFormReturn<DeliveryProgrammeFields> & {
    disabled?: DisabledFields<DeliveryProgrammeFields>;
  }
>;

export function DeliveryProgrammeFormFields({
  control,
  formState: { errors },
  disabled,
}: DeliveryProgrammeFormFieldsProps) {
  const armsLengthBodies = useArmsLengthBodyList();

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
        helperText="Are there any other names this Delivery Programme is also known as?"
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

      <FormSelectField
        control={control}
        errors={errors}
        index={i++}
        label="Arms Length Body"
        name="arms_length_body_id"
        options={armsLengthBodies}
        disabled={disabled}
        rules={{
          ...formRules.required,
        }}
      />

      <FormTextField
        control={control}
        errors={errors}
        index={i++}
        name="delivery_programme_code"
        label="Delivery Programme Code / Abbreviation"
        disabled={disabled}
        rules={{
          ...formRules.required,
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
