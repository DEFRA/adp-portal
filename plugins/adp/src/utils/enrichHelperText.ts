import type {
  FieldPath,
  FieldValues,
  UseControllerProps,
} from 'react-hook-form';

export function enrichHelperText<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>(
  helperText: string | undefined,
  rules: UseControllerProps<TFieldValues, TName>['rules'],
) {
  let result = helperText;
  if (!rules?.required) {
    if (!result) result = 'Optional';
    else result = `Optional - ${result}`;
  }

  return result;
}
