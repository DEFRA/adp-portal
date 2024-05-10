import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { DisabledFields } from '../../utils';
import { FormSelectField, formRules } from '../../utils';
import { useCatalogUsersList } from '../../hooks';

export type DeliveryProgrammeAdminFields = {
  user_catalog_name: string;
};

export const emptyForm = Object.freeze<DeliveryProgrammeAdminFields>({
  user_catalog_name: '',
});

export type DeliveryProgrammeAdminFormFieldsProps = Readonly<
  UseFormReturn<DeliveryProgrammeAdminFields> & {
    disabled?: DisabledFields<DeliveryProgrammeAdminFields>;
  }
>;

export function DeliveryProgrammeAdminFormFields({
  control,
  formState: { errors },
  disabled,
}: DeliveryProgrammeAdminFormFieldsProps) {
  const catalogUserOptions = useCatalogUsersList();

  let i = 0;
  return (
    <FormSelectField
      control={control}
      errors={errors}
      index={i++}
      label="Select User"
      helperText="Select a user to assign Admin permissions for this delivery programme"
      name="user_catalog_name"
      options={catalogUserOptions}
      disabled={disabled}
      rules={{
        ...formRules.required,
      }}
    />
  );
}
