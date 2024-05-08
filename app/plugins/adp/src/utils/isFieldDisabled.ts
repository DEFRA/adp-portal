import type { FieldPath, FieldValues } from 'react-hook-form';

export type DisabledFields<TFields extends FieldValues> =
  | boolean
  | ({
      [P in FieldPath<TFields>]?: boolean;
    } & {
      $default?: boolean;
    })
  | undefined;

export function isFieldDisabled<
  TFields extends FieldValues,
  TName extends FieldPath<TFields>,
>(disabled: DisabledFields<TFields>, field: TName) {
  switch (typeof disabled) {
    case 'boolean':
      return disabled;
    case 'undefined':
      return false;
    default:
      return !!(disabled[field] ?? disabled.$default ?? false);
  }
}
