import type {
  FieldErrors,
  FieldPath,
  FieldValues,
  UseControllerProps,
} from 'react-hook-form';
import { enrichHelperText } from './enrichHelperText';

export function getHelperText<
  TFields extends FieldValues,
  TName extends FieldPath<TFields>,
>(
  errors: FieldErrors<TFields>,
  name: TName,
  helperText: string | undefined,
  rules: UseControllerProps<TFields, TName>['rules'],
): string {
  const errorMessage = errors[name]?.message;
  if (errorMessage !== undefined) return String(errorMessage);
  return enrichHelperText(helperText, rules) ?? ' ';
}
