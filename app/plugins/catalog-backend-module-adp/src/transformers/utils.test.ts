import { createTransformerTitle } from "./utils";

describe('createTransformerTitle', () => {
  it('returns the title as is if no alias is provided', () => {
    const title = 'Example Title';
    expect(createTransformerTitle(title)).toBe(title);
  });

  it('puts the alias in brackets if provided', () => {
    const title = 'Example Title';
    const shortName = 'ET';
    const expected = 'Example Title (ET)';
    expect(createTransformerTitle(title, shortName)).toBe(expected);
  });
});
