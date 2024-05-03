import React, { useMemo } from 'react';
import {
  DisabledFields,
  FormSelectField,
  FormTextField,
  emailRegex,
  formRules,
} from '../../utils';
import { UseFormReturn, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import {
  useDeliveryProgrammesList,
  useComputedUntilChanged,
} from '../../hooks';
import { InputAdornment } from '@material-ui/core';
import { DeliveryProgramme } from '@internal/plugin-adp-common';

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
  setValue,
}: DeliveryProjectFormFieldsProps) {
  const deliveryProgrammes = useDeliveryProgrammesList();
  useComputedNamespace({ watch, setValue, deliveryProgrammes });

  function* deliveryProgrammeOptions() {
    for (const { id, title } of deliveryProgrammes.values())
      yield { label: title, value: id };
  }

  function getTitleAdornment() {
    const programme = deliveryProgrammes.get(watch('delivery_programme_id'));
    if (programme === undefined) return '';
    return programme.delivery_programme_code;
  }

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
        helperText="This must be unique and will be automatically prefixed with the delivery programme code."
        disabled={disabled}
        rules={{
          ...formRules.required,
          ...formRules.maxLength(100),
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start" style={{ marginTop: '0.15em' }}>
              {getTitleAdornment()}
            </InputAdornment>
          ),
        }}
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
        helperText="This must be unique and contain exactly 3 alphabetical characters. Example: ADP"
        disabled={disabled}
        rules={{
          ...formRules.required,
          ...formRules.pattern(
            /^[a-zA-Z]{3}$/,
            'Must contain exactly 3 alphabetical characters',
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
        name="namespace"
        label="Project Namespace"
        helperText="It will not be possible to edit the namespace after the project team has been created"
        disabled={disabled}
        rules={{
          ...formRules.required,
        }}
      />

      <FormTextField
        control={control}
        errors={errors}
        index={i++}
        name="ado_project"
        label="Azure DevOps Project"
        helperText="Name of the Azure DevOps project in the DEFRA.gov.uk organisation"
        disabled={disabled}
        rules={{
          ...formRules.required,
        }}
      />
    </>
  );
}

function useComputedNamespace({
  watch,
  setValue,
  deliveryProgrammes,
}: {
  watch: UseFormWatch<DeliveryProjectFields>;
  setValue: UseFormSetValue<DeliveryProjectFields>;
  deliveryProgrammes: Map<string, DeliveryProgramme>;
}) {
  const [namespace, programmeId, projectCode] = watch([
    'namespace',
    'delivery_programme_id',
    'delivery_project_code',
  ]);

  const autoNamespace = useMemo(() => {
    const programmeCode =
      deliveryProgrammes.get(programmeId)?.delivery_programme_code;
    return !programmeCode || !projectCode
      ? ''
      : `${programmeCode}-${projectCode}`;
  }, [programmeId, projectCode, deliveryProgrammes]);

  useComputedUntilChanged({
    computedValue: autoNamespace,
    currentValue: namespace,
    emptyValue: '',
    setValue: v => setValue('namespace', v),
  });
}
