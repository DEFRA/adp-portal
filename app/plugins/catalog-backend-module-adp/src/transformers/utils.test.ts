import { createTitle } from "./utils";

describe('createTitle', () => {
  it('returns the title as is if no short_name is provided', () => {
    const title = 'Example Title';
    expect(createTitle(title)).toBe(title);
  });

  it('puts the short_name in brackets if provided', () => {
    const title = 'Example Title';
    const shortName = 'ET';
    const expected = 'Example Title (ET)';
    expect(createTitle(title, shortName)).toBe(expected);
  });
});
