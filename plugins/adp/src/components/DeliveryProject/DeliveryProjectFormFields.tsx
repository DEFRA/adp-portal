import React, { useMemo } from 'react';
import type { DisabledFields } from '../../utils';
import {
  FormSelectField,
  FormTextField,
  emailRegex,
  formRules,
} from '../../utils';
import type { UseFormReturn } from 'react-hook-form';
import { useDeliveryProgrammesList } from '../../hooks';
import { InputAdornment, TextField } from '@material-ui/core';
import type { DeliveryProgramme } from '@internal/plugin-adp-common';
import { createName } from '@internal/plugin-adp-common';

export type DeliveryProjectFields = {
  title: string;
  alias?: string;
  description: string;
  team_type: string;
  github_team_visibility: 'public' | 'private';
  delivery_programme_id: string;
  delivery_project_code: string;
  finance_code?: string;
  service_owner: string;
  namespace: string;
  ado_project: string;
};

export type DeliveryProjectFormFieldsProps = Readonly<
  UseFormReturn<DeliveryProjectFields> & {
    disabled?: DisabledFields<DeliveryProjectFields>;
  }
>;

export const emptyForm = Object.freeze<DeliveryProjectFields>({
  alias: '',
  description: '',
  title: '',
  ado_project: '',
  delivery_programme_id: '',
  delivery_project_code: '',
  github_team_visibility: '' as 'public',
  namespace: '',
  service_owner: '',
  team_type: '',
  finance_code: '',
});

export function DeliveryProjectFormFields({
  control,
  formState: { errors },
  disabled,
  watch,
}: DeliveryProjectFormFieldsProps) {
  const selected = useMemo(() => watch('delivery_programme_id'), [watch]);
  const deliveryProgrammes = useDeliveryProgrammesList(selected);

  function* deliveryProgrammeOptions() {
    for (const { id, title } of deliveryProgrammes.values())
      yield { label: title, value: id };
  }

  const programme = deliveryProgrammes.get(watch('delivery_programme_id'));
  const titlePrefix = programme?.delivery_programme_code;

  const namespace = computeNamespace(
    watch('namespace'),
    programme,
    watch('title'),
  );

  let i = 0;
  return (
    <>
      <FormSelectField
        control={control}
        errors={errors}
        index={i++}
        label="Delivery Programme"
        name="delivery_programme_id"
        options={[...deliveryProgrammeOptions()]}
        disabled={disabled}
        rules={{
          ...formRules.required,
        }}
      />
      <FormTextField
        control={control}
        errors={errors}
        index={i++}
        name="title"
        label="Name"
        helperText="This must be unique and between 3 and 50 characters. It will be automatically prefixed with the delivery programme code."
        disabled={disabled}
        rules={{
          ...formRules.required,
          ...formRules.maxLength(50),
          ...formRules.minLength(3),
        }}
        InputProps={{
          startAdornment: !!titlePrefix && (
            <InputAdornment position="start" style={{ marginTop: '0.15em' }}>
              {titlePrefix}
            </InputAdornment>
          ),
        }}
      />
      <TextField
        value={namespace}
        name="namespace"
        label="Namespace"
        variant="outlined"
        fullWidth
        margin="dense"
        helperText="A namespace serves as a logical grouping for your applications and/or services, functioning as a security boundary. Each team or project has its own namespace, and editing is not possible after the creation of the project team."
        disabled
      />
      <FormTextField
        control={control}
        errors={errors}
        index={i++}
        name="alias"
        label="Alias"
        helperText="Are there any other names this Delivery Project is also known as?"
        disabled={disabled}
      />
      <FormTextField
        control={control}
        errors={errors}
        index={i++}
        name="description"
        label="Description"
        helperText="Max 500 characters"
        disabled={disabled}
        maxRows={4}
        rules={{
          ...formRules.required,
          ...formRules.maxLength(500),
        }}
      />
      <FormSelectField
        control={control}
        errors={errors}
        index={i++}
        label="Team Type"
        name="team_type"
        options={[
          { label: 'Delivery Team', value: 'delivery' },
          { label: 'Platform Team', value: 'platform' },
        ]}
        disabled={disabled}
        rules={{
          ...formRules.required,
        }}
      />
      <FormSelectField
        control={control}
        errors={errors}
        index={i++}
        label="GitHub Team Visibility"
        name="github_team_visibility"
        helperText="The privacy level this team should have. Visible teams can be seen by all members in the organization. Secret teams can only be seen by the organization owners and team members."
        options={[
          { label: 'Publicly visible', value: 'public' },
          { label: 'Only team members', value: 'private' },
        ]}
        disabled={disabled}
        rules={{
          ...formRules.required,
        }}
      />
      <FormTextField
        control={control}
        errors={errors}
        index={i++}
        name="delivery_project_code"
        label="CCoE Service Code"
        helperText="This must contain exactly three alphabetical characters. Example: ADP"
        disabled={disabled}
        rules={{
          ...formRules.required,
          ...formRules.pattern(
            /^[a-zA-Z]{3}$/,
            'Must contain exactly three alphabetical characters',
          ),
        }}
      />
      <FormTextField
        control={control}
        errors={errors}
        index={i++}
        name="finance_code"
        label="CCoE Finance Cost Center Code"
        helperText="provide the CCoE Finance Cost Centre Code. E.g. DEFCOOD3P1234"
        disabled={disabled}
      />
      <FormTextField
        control={control}
        errors={errors}
        index={i++}
        name="service_owner"
        label="Business Service Owner"
        helperText="Email address of the service owner"
        disabled={disabled}
        rules={{
          ...formRules.pattern(emailRegex, 'Invalid email address'),
        }}
      />
      <FormTextField
        control={control}
        errors={errors}
        index={i++}
        name="ado_project"
        label="Azure DevOps Project"
        helperText="Name of the Azure DevOps project in the DefraGovUk organisation"
        disabled={disabled}
        rules={{
          ...formRules.required,
        }}
      />
    </>
  );
}

function computeNamespace(
  current: string | undefined,
  programme: DeliveryProgramme | undefined,
  title: string,
) {
  if (current) return current;
  if (!programme || !title) return '';
  return createName(`${programme.delivery_programme_code}-${title}`);
}
