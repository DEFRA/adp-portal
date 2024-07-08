import React from 'react';
import { getComponentData } from '@backstage/core-plugin-api';
import { DeliveryProjectPickerFieldExtension } from './index';
import {
  DeliveryProjectPicker,
  DeliveryProjectPickerSchema,
} from './components/DeliveryProjectPicker/DeliveryProjectPicker';

describe('DeliveryProjectPickerFieldExtension', () => {
  it('Should be match the expected component data', () => {
    const data = getComponentData(
      <DeliveryProjectPickerFieldExtension />,
      'scaffolder.extensions.field.v1',
    );
    expect(data).toEqual({
      component: DeliveryProjectPicker,
      name: 'DeliveryProjectPicker',
      schema: DeliveryProjectPickerSchema,
    });
  });
});
