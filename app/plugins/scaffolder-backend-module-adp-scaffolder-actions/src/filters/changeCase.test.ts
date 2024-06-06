import type { JsonValue } from '@backstage/types';
import { textCases } from './util/textCases';
import { changeCase } from './changeCase';

const textCaseNames = Object.keys(textCases);
const inputs: readonly JsonValue[] = [
  'ThisIsPascalCase',
  'thisIsCamelCase',
  'this-is-kebab-case',
  'THIS-IS-SCREAMING-KEBAB-CASE',
  'this_is_snake_case',
  'THIS_IS_SCREAMING_SNAKE_CASE',
  'this.is.dot.case',
  'This is title case',
];
interface TestCase {
  input: JsonValue;
  from: JsonValue;
  inputJSON: string;
  fromJSON: string;
}

describe('changeCase', () => {
  it.each<TestCase>(
    inputs.flatMap(input =>
      textCaseNames.flatMap(from =>
        textCaseNames.map(to => ({
          input,
          from,
          to,
          inputJSON: JSON.stringify(input),
          fromJSON: JSON.stringify(from),
          toJSON: JSON.stringify(to),
        })),
      ),
    ),
  )('Should convert $inputJSON from $fromJSON', ({ input, from }) => {
    // act
    const actual = Object.fromEntries(
      textCaseNames.map(to => [to, changeCase(input, from, to)]),
    );

    // assert
    expect(actual).toMatchSnapshot();
  });
});
