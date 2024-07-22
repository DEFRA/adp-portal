import type { ValidationError as Item } from '@internal/plugin-adp-common';
import { ValidationError } from './ValidationError';

describe('ValidationError', () => {
  it('Should have the correct message', () => {
    // arrange
    const errors: Item[] = [];

    // act
    const result = new ValidationError(errors);

    // assert
    expect(result.message).toBe('Validation failed');
  });

  it('Should expose the errors it is constructed with', () => {
    // arrange
    const errors: Item[] = [];

    // act
    const result = new ValidationError(errors);

    // assert
    expect(result.errors).toBe(errors);
  });
});
