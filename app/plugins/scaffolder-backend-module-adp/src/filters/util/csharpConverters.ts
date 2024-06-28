import type { JsonValue } from '@backstage/types';

type Converter = (value: JsonValue) => string;
export const csharpConverters = {
  value(value) {
    return stringify(value);
  },
  namespace(value): string {
    return String(value)
      .split(/[ -.]+/g)
      .map(csharpConverters.identifier)
      .join('.');
  },
  identifier(value) {
    const str = String(value);
    const pascalCase = str[0].toUpperCase() + str.slice(1);
    const withLegalLeadingCharacter = /^[_\p{L}\p{Nl}]/iu.test(pascalCase)
      ? pascalCase
      : `_${pascalCase}`;
    const withLegalRemainingCharacters = withLegalLeadingCharacter.replaceAll(
      /[^_\p{Nd}\p{L}\p{Nl}\p{Mn}\p{Mc}]+/giu,
      '_',
    );
    return withLegalRemainingCharacters;
  },
} satisfies Record<string, Converter>;

function stringify(value: unknown): string {
  switch (typeof value) {
    case 'number':
      return JSON.stringify(value);
    case 'bigint':
      return `new System.Numerics.BigInteger(${JSON.stringify(
        value.toString(),
      )})`;
    case 'undefined':
      return JSON.stringify(null);
    case 'boolean':
      return JSON.stringify(value);
    case 'string':
      return JSON.stringify(value);
    case 'object': {
      if (value === null) return JSON.stringify(null);
      const properties = [];
      for (const [k, v] of Object.entries(value)) {
        try {
          const asCsharp = stringify(v);
          properties.push(`${k} = ${asCsharp}`);
        } catch {
          // NO-OP
        }
      }
      return `new 
{${properties.map(p => `\n  ${p}`).join('')}
}`;
    }
    default:
      throw new Error(`Cannot represent ${typeof value} in C#`);
  }
}
