import type { InputBaseComponentProps } from '@material-ui/core';
import type {
  FieldPath,
  FieldValues,
  UseControllerProps,
  ValidationRule,
  ValidationValue,
} from 'react-hook-form';

export function rulesToHtmlProperties<
  TFields extends FieldValues,
  TName extends FieldPath<TFields>,
>(rules: UseControllerProps<TFields, TName>['rules']) {
  return {
    'aria-required': getValidationRule(rules?.required) ? true : undefined,
    maxLength: getValidationRule(rules?.maxLength),
    minLength: getValidationRule(rules?.minLength),
  } satisfies InputBaseComponentProps;
}

function getValidationRule<T extends ValidationValue>(
  rule?: ValidationRule<T>,
) {
  switch (typeof rule) {
    case 'undefined':
      return undefined;
    case 'object':
      if (rule instanceof RegExp) return rule as T;
      return rule.value;
    default:
      return rule;
  }
}
