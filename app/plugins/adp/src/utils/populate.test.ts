import { populate } from './populate';

describe('populate', () => {
  it.each([
    {
      base: { abc: '', def: '123' },
      replacements: { abc: 'xyz', other: false },
      expected: { abc: 'xyz', def: '123' },
    },
  ])('', ({ base, replacements, expected }) => {
    expect(populate(base, replacements)).toMatchObject(expected);
  });
});
