import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import {
  FormSelectField,
  FormTextField,
  formRules,
  type DisabledFields,
} from '../../utils';
import { useCatalogUsersList } from '../../hooks';
import { FormCheckboxField } from '../../utils/FormCheckboxField';

export type DeliveryProjectUserFields = {
  user_catalog_name: string;
  is_admin: boolean;
  is_technical: boolean;
  github_username: string;
};

export const emptyForm = Object.freeze<DeliveryProjectUserFields>({
  user_catalog_name: '',
  is_admin: false,
  is_technical: false,
  github_username: '',
});

export type DeliveryProjectUserFormFieldsProps = Readonly<
  UseFormReturn<DeliveryProjectUserFields> & {
    disabled?: DisabledFields<DeliveryProjectUserFields>;
  }
>;

export function DeliveryProjectUserFormFields({
  control,
  formState: { errors },
  disabled,
}: DeliveryProjectUserFormFieldsProps) {
  const catalogUserOptions = useCatalogUsersList();

  let i = 0;
  return (
    <>
      <FormSelectField
        control={control}
        errors={errors}
        index={i++}
        label="Select User"
        helperText="Select a user to add to this Delivery Project"
        name="user_catalog_name"
        options={catalogUserOptions}
        disabled={disabled}
        rules={{
          ...formRules.required,
        }}
      />

      <FormCheckboxField
        control={control}
        errors={errors}
        index={i++}
        label="Admin user?"
        helperText="Can this user administer this project?"
        name="is_admin"
        disabled={disabled}
      />

      <FormCheckboxField
        control={control}
        errors={errors}
        index={i++}
        label="Technical user?"
        helperText="Is this user in a technical role?"
        name="is_technical"
        disabled={disabled}
      />

      <FormTextField
        control={control}
        errors={errors}
        index={i++}
        label="GitHub Handle"
        helperText="Enter this user's Github username"
        name="github_username"
        disabled={disabled}
      />
    </>
  );
}
