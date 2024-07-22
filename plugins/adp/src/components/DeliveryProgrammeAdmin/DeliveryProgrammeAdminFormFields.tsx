import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { DisabledFields } from '../../utils';
import { formRules, FormMultiSelectAutoCompleteField } from '../../utils';
import { useCatalogUsersLiveSearch } from '../../hooks';

export type DeliveryProgrammeAdminFields = {
  user_catalog_name: Array<{
    label: string;
    value: string;
  }>;
};

export const emptyForm = Object.freeze<DeliveryProgrammeAdminFields>({
  user_catalog_name: [],
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
  const getOptions = useCatalogUsersLiveSearch();
  let i = 0;
  return (
    <FormMultiSelectAutoCompleteField
      control={control}
      errors={errors}
      index={i++}
      label="Select Users"
      helperText="Select users to assign Admin permissions for this delivery programme (Type to search for users)"
      name="user_catalog_name"
      disabled={disabled}
      rules={{
        ...formRules.required,
      }}
      getOptions={getOptions}
    />
  );
}
