import { normalizeUsername } from './normalizeUsername';

describe('normalizeUsername', () => {
  it.each([
    { input: 'User Name', expected: 'user_name' },
    { input: 'User (Name)', expected: 'user_name' },
    { input: 'User :(Name:)', expected: 'user_name' },
    { input: 'user.name@example.com', expected: 'user.name_example.com' },
  ])('Should normalize $input -> $expected', ({ input, expected }) => {
    expect(normalizeUsername(input)).toBe(expected);
  });
});
