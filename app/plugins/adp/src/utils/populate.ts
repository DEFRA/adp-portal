export function populate<T extends object>(base: T, replacements: Partial<T>) {
  const result = { ...base };
  for (const key of Object.keys(base) as (keyof T)[])
    if (key in replacements) result[key] = replacements[key]!;
  return result;
}
