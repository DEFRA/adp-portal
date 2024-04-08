import React, { FC, useEffect } from 'react';
import { ActionsModal, ActionsModalProps } from '../../utils/ActionsModal';
import { FormProvider, useForm } from 'react-hook-form';

export const CreateDeliveryProjectModal: FC<ActionsModalProps> = props => {
  const { initialValues, ...otherProps } = props;
  const methods = useForm({ defaultValues: initialValues });

  useEffect(() => {
    methods.setValue('namespace', initialValues.namespace);
  }, [initialValues]);

  return (
    <FormProvider {...methods}>
      <ActionsModal initialValues={initialValues} {...otherProps} />
    </FormProvider>
  );
};
