import { UseControllerProps } from 'react-hook-form';

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

export const emailRegex =
  /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
