import type { JsonValue } from '@backstage/types';
import { textCases } from './util/textCases';

type CaseName = keyof typeof textCases;
const caseNames = Object.keys(textCases) as readonly CaseName[];

export function changeCase(input: JsonValue, from: JsonValue, to: JsonValue) {
  if (from === undefined) throw new Error('argument from is required');
  if (to === undefined) throw new Error('argument to is required');
  const inputStr = String(input);
  const fromStr = String(from);
  const toStr = String(to);
  if (!isCase(fromStr))
    throw new Error(
      `Unsupported from case ${fromStr}. Must be one of ${caseNames.join(',')}`,
    );
  if (!isCase(toStr))
    throw new Error(
      `Unsupported to case ${toStr}. Must be one of ${caseNames.join(',')}`,
    );

  const words = textCases[fromStr].toWords(inputStr);
  return textCases[toStr].fromWords(words);
}

function isCase(value: string): value is (typeof caseNames)[number] {
  return caseNames.includes(value as any);
}
