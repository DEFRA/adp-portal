import { checkUsernameIsReserved } from './reservedUsernames';

describe('reservedUsernames', () => {
  it('should return true if username is reserved', () => {
    const username = 'user';
    const result = checkUsernameIsReserved(username);
    expect(result).toBeTruthy();
  });
  it('should return false if username is not in reserved list', () => {
    const username = 'user1';
    const result = checkUsernameIsReserved(username);
    expect(result).toBeFalsy();
  });
});
