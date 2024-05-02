import { FieldPath } from 'react-hook-form';
import { DisabledFields, isFieldDisabled } from './isFieldDisabled';

type Fields = {
  foo: string;
  bar: number;
  baz: boolean;
};

describe('isFieldDisabled', () => {
  it.each<{
    disabled: DisabledFields<Fields>;
    field: FieldPath<Fields>;
    expected: boolean;
  }>([
    {
      disabled: undefined,
      field: 'foo',
      expected: false,
    },
    {
      disabled: false,
      field: 'foo',
      expected: false,
    },
    {
      disabled: true,
      field: 'foo',
      expected: true,
    },
    {
      disabled: {},
      field: 'foo',
      expected: false,
    },
    {
      disabled: {
        foo: false,
      },
      field: 'foo',
      expected: false,
    },
    {
      disabled: {
        foo: true,
      },
      field: 'foo',
      expected: true,
    },
    {
      disabled: {
        bar: false,
      },
      field: 'foo',
      expected: false,
    },
    {
      disabled: {
        bar: true,
      },
      field: 'foo',
      expected: false,
    },
  ])(
    'Should correctly determine if a field is disabled',
    ({ disabled, field, expected }) => {
      expect(isFieldDisabled(disabled, field)).toBe(expected);
    },
  );
});
