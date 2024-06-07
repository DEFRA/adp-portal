import { path } from './path';

const inputs = [
  ['/my/path', 'abc/'],
  ['/my/path', 'abc'],
  ['/my/path/', 'abc'],
  ['/my/path', '/abc'],
  ['/my/path/', '/abc'],
  ['/my/path', './abc'],
  ['/my/path/', './abc'],
  ['https://test.com', 'abc/'],
  ['https://test.com', 'abc'],
  ['https://test.com/', 'abc'],
  ['https://test.com', '/abc'],
  ['https://test.com/', '/abc'],
  ['https://test.com', './abc'],
  ['https://test.com/', './abc'],
  ['C:/Users/Test', 'abc/'],
  ['C:/Users/Test', 'abc'],
  ['C:/Users/Test/', 'abc'],
  ['C:/Users/Test', '/abc'],
  ['C:/Users/Test/', '/abc'],
  ['C:/Users/Test', './abc'],
  ['C:/Users/Test/', './abc'],
] as const;

interface TestCase {
  readonly input: readonly [string, ...string[]];
  readonly inputJSON: string;
}

describe('path', () => {
  it.each<TestCase>(
    inputs.map(input => ({
      input,
      inputJSON: JSON.stringify(input),
    })),
  )('Should join $inputJSON', ({ input }) => {
    // act
    const actual = path(...input);

    // assert
    expect(actual).toMatchSnapshot();
  });
});
