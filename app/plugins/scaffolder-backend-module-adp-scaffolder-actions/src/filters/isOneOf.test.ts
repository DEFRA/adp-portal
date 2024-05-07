import { isOneOf } from './isOneOf';

const jsonValue = [
  123,
  'abc',
  true,
  [123],
  { xyz: false },
  456,
  'def',
  false,
  [],
  {},
];

describe('isOneOf', () => {
  it.each(
    jsonValue.flatMap(opt => [
      { target: opt, options: jsonValue, expected: true },
      {
        target: opt,
        options: jsonValue.filter(v => v !== opt),
        expected: false,
      },
    ]),
  )(
    'Should return $expected when target = $target and options = $options',
    ({ target, options, expected }) => {
      expect(isOneOf(target, ...options)).toBe(expected);
    },
  );
});
