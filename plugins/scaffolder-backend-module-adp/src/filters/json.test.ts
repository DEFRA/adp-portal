import type { JsonValue } from '@backstage/types';
import { json } from './json';

const inputs: JsonValue[] = [
  123,
  'abc',
  true,
  false,
  null,
  `This is some multiline text
and this is line 2!`,
  `This input: contains special characters! "|'{}[],&*#?<>=%@/\\
And even a newline!`,
  '"This already looks like json but should be escaped"',
  {
    some: {
      object: {
        with: ['values'],
      },
    },
  },
];

interface TestCase {
  readonly input: JsonValue;
  readonly inputJSON: string;
}

describe('json', () => {
  it.each<TestCase>(
    inputs.map(i => ({ input: i, inputJSON: JSON.stringify(i) })),
  )('Should correctly handle $inputJSON', ({ input }) => {
    // act
    const actual = json(input);

    // assert
    expect(actual).toMatchSnapshot();
  });
});
