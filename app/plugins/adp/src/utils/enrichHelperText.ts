import { FieldPath, FieldValues, UseControllerProps } from 'react-hook-form';

export function enrichHelperText<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>(
  helperText: string | undefined,
  rules: UseControllerProps<TFieldValues, TName>['rules'],
) {
  if (!rules?.required) {
    if (!helperText) helperText = 'Optional';
    else helperText = 'Optional - ' + helperText;
  }

  return helperText;
}
