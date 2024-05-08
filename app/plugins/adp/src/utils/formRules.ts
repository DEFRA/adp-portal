import type { UseControllerProps } from 'react-hook-form';

export const formRules = {
  required: { required: 'This field is required' },
  maxLength(count: number) {
    return {
      maxLength: {
        value: count,
        message: `Maximum length is ${count} characters`,
      },
    };
  },
  minLength(count: number) {
    return {
      minLength: {
        value: count,
        message: `Minimum length is ${count} characters`,
      },
    };
  },
  pattern(pattern: RegExp, message: string) {
    return {
      pattern: {
        value: pattern,
        message: message,
      },
    };
  },
} as const satisfies {
  [P in keyof Rules]: Pick<Rules, P> | ((...args: any[]) => Pick<Rules, P>);
};

type Rules = Exclude<UseControllerProps['rules'], undefined>;

const emailRegexSource: string =
  '^' +
  '(([^<>()[\\]\\\\.,;:\\s@\\"]+(\\.[^<>()[\\]\\\\.,;:\\s@\\"]+)*)|(\\".+\\"))' +
  '@' +
  '((\\[\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\])|(([a-zA-Z\\-\\d]+\\.)+[a-zA-Z]{2,}))' +
  '$';
export const emailRegex = new RegExp(emailRegexSource);
