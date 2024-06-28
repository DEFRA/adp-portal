export function serviceId<T extends string>(id: T): `credentials-context.${T}` {
  return `credentials-context.${id}`;
}
