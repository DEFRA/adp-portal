import { Response } from 'express';
import { ValidationErrorMapping } from '@internal/plugin-adp-common';
import { InputError } from '@backstage/errors';
import { z } from 'zod';

export function respond<Request, Success, Error extends string>(
  request: Request,
  response: Response,
  message:
    | { success: true; value: Success }
    | { success: false; errors: Error[] },
  mapping: ValidationErrorMapping<Request, Error>,
  statuses?: { ok?: number; badRequest?: number },
) {
  if (!message.success) {
    response.status(statuses?.badRequest ?? 400).json({
      errors: message.errors.map(e => mapping[e](request)),
    });
  } else if (message.value === undefined) {
    response.status(statuses?.ok ?? 204).end();
  } else {
    response.status(statuses?.ok ?? 200).json(message.value);
  }
}

export function createParser<T>(schema: z.ZodType<T>) {
  return (body: unknown) => {
    const result = schema.safeParse(body);
    if (result.success) return result.data;
    throw new InputError(result.error.message);
  };
}

export type SafeResult<Success, Error extends PropertyKey> =
  | { success: true; value: Success }
  | { success: false; errors: Array<Error | 'unknown'> };

export const emptyUUID = '00000000-0000-0000-0000-000000000000';
export type UUID = `${string}-${string}-${string}-${string}-${string}`;

export function isUUID(value: string): value is UUID {
  return /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(
    value,
  );
}

export async function checkMany<
  T extends Record<string, boolean | Promise<boolean>>,
>(checks: T): Promise<SafeResult<undefined, keyof T>> {
  const results: Array<[keyof T, boolean]> = await Promise.all(
    Object.entries(checks).map(async e => [e[0], await e[1]] as const),
  );
  const failed = results.filter(x => x[1]);
  if (failed.length === 0) return { success: true, value: undefined };

  return { success: false, errors: failed.map(x => x[0]) };
}

export function containsAnyValue(obj: object) {
  return Object.entries(obj).some(e => e[1] !== undefined);
}
