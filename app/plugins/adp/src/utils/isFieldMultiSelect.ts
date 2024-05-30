import type { FieldPath, FieldValues } from 'react-hook-form';

export type MultiselectFields<TFields extends FieldValues> =
  | boolean
  | ({
      [P in FieldPath<TFields>]?: boolean;
    } & {
      $default?: boolean;
    })
  | undefined;

export function isFieldMultiselect<
  TFields extends FieldValues,
  TName extends FieldPath<TFields>,
>(multiple: MultiselectFields<TFields>, field: TName) {
  switch (typeof multiple) {
    case 'boolean':
      return multiple;
    case 'undefined':
      return false;
    default:
      return !!(multiple[field] ?? multiple.$default ?? false);
  }
}
