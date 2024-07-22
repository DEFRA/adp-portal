import { createScaffolderFieldExtension } from '@backstage/plugin-scaffolder-react';
import { scaffolderPlugin } from '@backstage/plugin-scaffolder';
import {
  DeliveryProjectPicker,
  DeliveryProjectPickerSchema,
} from './components/DeliveryProjectPicker/DeliveryProjectPicker';

export * from './components';

export const DeliveryProjectPickerFieldExtension = scaffolderPlugin.provide(
  createScaffolderFieldExtension({
    component: DeliveryProjectPicker,
    name: 'DeliveryProjectPicker',
    schema: DeliveryProjectPickerSchema,
  }),
);
