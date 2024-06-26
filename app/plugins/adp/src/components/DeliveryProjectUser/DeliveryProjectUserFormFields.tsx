import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import {
  FormCheckboxField,
  FormAutoCompleteField,
  FormTextField,
  formRules,
  type DisabledFields,
} from '../../utils';
import { useCatalogUsersLiveSearch } from '../../hooks';

export type DeliveryProjectUserFields = {
  user_catalog_name: {
    label: string;
    value: string;
  };
  is_admin: boolean;
  is_technical: boolean;
  github_username: string;
};

export const emptyForm = Object.freeze<DeliveryProjectUserFields>({
  user_catalog_name: {
    label: '',
    value: '',
  },
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
  const getOptions = useCatalogUsersLiveSearch();

  let i = 0;
  return (
    <>
      <FormAutoCompleteField
        control={control}
        errors={errors}
        index={i++}
        label="Select User"
        helperText="Select a user to add to this Delivery Project"
        name="user_catalog_name"
        getOptions={getOptions}
        disabled={disabled}
        rules={{
          ...formRules.required,
        }}
      />

      <h3 style={{ marginBottom: 0 }}>Additional permissions</h3>

      <FormCheckboxField
        control={control}
        errors={errors}
        index={i++}
        label="Admin user"
        helperText="Can this user administer this project?"
        name="is_admin"
        disabled={disabled}
      />

      <FormCheckboxField
        control={control}
        errors={errors}
        index={i++}
        label="Technical user"
        helperText="Is this user in a technical role, i.e. developer?"
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
        rules={{
          pattern: {
            value: /^\s*[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}\s*$/i,
            message: 'Please enter a valid GitHub handle',
          },
          validate: (value, values) =>
            values.is_technical === false ||
            (values.is_technical && value.trim() !== '') ||
            'A GitHub handle is required for technical users',
        }}
      />
    </>
  );
}
