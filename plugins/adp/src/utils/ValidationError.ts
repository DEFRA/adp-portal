import type { ValidationError as Item } from '@internal/plugin-adp-common';

export class ValidationError<Path extends string = string> extends Error {
  constructor(public readonly errors: readonly Item<Path>[]) {
    super('Validation failed');
  }
}
