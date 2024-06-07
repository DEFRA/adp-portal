import type { JsonValue } from '@backstage/types';
import { yaml } from './yaml';

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
  '|-\n  This already looks like yaml but shouldnt be treated as yaml',
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

describe('yaml', () => {
  it.each<TestCase>(
    inputs.map(input => (
      { input, inputJSON: JSON.stringify(input) }
    )),
  )(
    'Should correctly handle $inputJSON',
    ({ input }) => {
      // act
      const actual = yaml(input);

      // assert
      expect(actual).toMatchSnapshot();
    },
  );
});
