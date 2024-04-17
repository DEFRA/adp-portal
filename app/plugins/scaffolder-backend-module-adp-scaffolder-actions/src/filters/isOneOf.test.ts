import { isOneOf } from './isOneOf';

const options = [
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
    options.flatMap(opt => [
      { target: opt, options, expected: true },
      { target: opt, options: options.filter(v => v !== opt), expected: false },
    ]),
  )(
    'Should return $expected when target = $target and options = $options',
    ({ target, options, expected }) => {
      expect(isOneOf(target, ...options)).toBe(expected);
    },
  );
});
