import type { JsonValue } from '@backstage/types';
import { csharpConverters } from './util/csharpConverters';
import { csharp } from './csharp';

const converters = Object.keys(
  csharpConverters,
) as readonly (keyof typeof csharpConverters)[];
const inputs: JsonValue[] = [
  'My Cool Project',
  'My-Cool-Project',
  'my_cool_project',
  'test@email.com',
  '123 xyz',
  true,
  false,
  123.456,
  { some: { cool: 'object' } },
  null,
];

interface TestCase {
  readonly input: JsonValue;
  readonly type?: JsonValue;
  readonly inputJSON: string;
}
describe('csharp', () => {
  it.each<TestCase>(
    inputs.flatMap(input =>
      converters.map(type => ({
        input,
        type,
        inputJSON: JSON.stringify(input),
      })),
    ),
  )('Should format $inputJSON as $type', ({ input, type }) => {
    // act
    const actual = csharp(input, type);

    // assert
    expect(actual).toMatchSnapshot();
  });
});
