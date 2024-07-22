import { makeFieldSchemaFromZod } from '@backstage/plugin-scaffolder';
import { z } from 'zod';

export const DeliveryProjectPickerFieldSchema = makeFieldSchemaFromZod(
  z.string(),
  z.object({}),
);
export type DeliveryProjectPickerUiOptions =
  typeof DeliveryProjectPickerFieldSchema.uiOptionsType;

export type DeliveryProjectPickerProps = Readonly<
  typeof DeliveryProjectPickerFieldSchema.type
>;

export const DeliveryProjectPickerSchema =
  DeliveryProjectPickerFieldSchema.schema;
