// derived from: https://github.com/backstage/backstage/blob/v1.28.4/plugins/scaffolder/src/components/fields/EntityPicker/EntityPicker.tsx

import React, { useCallback, useEffect } from 'react';
import { EntityDisplayName } from '@backstage/plugin-catalog-react';
import { type Entity, stringifyEntityRef } from '@backstage/catalog-model';
import FormControl from '@material-ui/core/FormControl';
import TextField from '@material-ui/core/TextField';
import Autocomplete, {
  createFilterOptions,
} from '@material-ui/lab/Autocomplete';
import { VirtualizedListbox } from '../VirtualizedListbox';
import type { DeliveryProjectPickerProps } from './schema';
import {} from '@backstage/plugin-scaffolder';
import { useDeliveryProjects } from './useDeliveryProjects';
import Alert from '@material-ui/lab/Alert';
import FormLabel from '@material-ui/core/FormLabel';

export { DeliveryProjectPickerSchema } from './schema';

export function DeliveryProjectPicker(props: DeliveryProjectPickerProps) {
  const {
    onChange,
    schema: {
      title = 'Delivery Project',
      description = 'The delivery project that will own the component.',
    },
    required,
    rawErrors,
    formData,
    idSchema,
  } = props;

  const {
    value: { catalogEntities, entityRefToPresentation } = noProjects(),
    loading,
  } = useDeliveryProjects();

  const onSelect = useCallback(
    (_: any, ref: Entity | null) => {
      onChange(ref ? stringifyEntityRef(ref) : undefined);
    },
    [onChange],
  );

  const selectedEntity =
    catalogEntities.find(e => stringifyEntityRef(e) === formData) ?? null;

  useEffect(() => {
    if (catalogEntities.length === 1 && selectedEntity === null) {
      onChange(stringifyEntityRef(catalogEntities[0]));
    }
  }, [catalogEntities, onChange, selectedEntity]);

  if (!loading && catalogEntities.length === 0) {
    return (
      <FormControl
        margin="normal"
        required={required}
        error={rawErrors?.length > 0 && !formData}
      >
        <FormLabel>{title}</FormLabel>
        <Alert severity="error">
          You are not able to scaffold a service. Only technical team members
          for Delivery Projects can scaffold services for their Delivery Project
        </Alert>
      </FormControl>
    );
  }

  return (
    <FormControl
      margin="normal"
      required={required}
      error={rawErrors?.length > 0 && !formData}
    >
      <Autocomplete
        disabled={catalogEntities.length === 1}
        id={idSchema?.$id}
        value={selectedEntity}
        loading={loading}
        onChange={onSelect}
        options={catalogEntities}
        getOptionLabel={option =>
          entityRefToPresentation.get(stringifyEntityRef(option))?.entityRef!
        }
        autoSelect
        renderInput={params => (
          <TextField
            {...params}
            label={title}
            margin="dense"
            helperText={description}
            FormHelperTextProps={{ margin: 'dense', style: { marginLeft: 0 } }}
            variant="outlined"
            required={required}
            InputProps={params.InputProps}
          />
        )}
        renderOption={option => <EntityDisplayName entityRef={option} />}
        filterOptions={createFilterOptions<Entity>({
          stringify: option =>
            entityRefToPresentation.get(stringifyEntityRef(option))
              ?.primaryTitle!,
        })}
        ListboxComponent={VirtualizedListbox}
      />
    </FormControl>
  );
}

function noProjects(): NonNullable<
  ReturnType<typeof useDeliveryProjects>['value']
> {
  return {
    catalogEntities: [],
    entityRefToPresentation: new Map(),
  };
}
