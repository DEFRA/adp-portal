import { createName, createTitle } from './utils';

describe('createName', () => {
  it('replaces spaces with dashes and converts to lowercase', () => {
    const input = 'Example Name';
    const expected = 'example-name';
    expect(createName(input)).toBe(expected);
  });

  it('handles strings longer than 64 characters', () => {
    const longName = 'a'.repeat(70);
    const expected = 'a'.repeat(64);
    expect(createName(longName)).toBe(expected);
  });

  it('removes extra spaces within the name', () => {
    const input = 'Example   Name With  Spaces';
    const expected = 'example-name-with-spaces';
    expect(createName(input)).toBe(expected);
  });
});

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
