import type { JsonValue } from '@backstage/types';
import { queryparam } from './queryparam';

const inputs = [
  { url: 'https://test.com', key: 'abc', value: '123' },
  { url: 'https://test.com?abc=xyz', key: 'abc', value: '123' },
  { url: 'https://test.com?xyz=123', key: 'abc', value: '123' },
  { url: 'https://test.com', key: 'abc', value: 123 },
  { url: 'https://test.com', key: 'abc', value: true },
  { url: 'https://test.com', key: 'abc', value: false },
  { url: 'https://test.com', key: 'abc', value: null },
  { url: 'https://test.com', key: 'abc', value: { prop1: { nested: true } } },
  { url: 'https://test.com', key: 'abc', value: [1, 2, 3] },
];

interface TestCase {
  readonly url: JsonValue;
  readonly key: JsonValue;
  readonly value: JsonValue;
  readonly urlJSON: string;
  readonly keyJSON: string;
  readonly valueJSON: string;
}

describe('queryparam', () => {
  it.each<TestCase>(
    inputs.map(input => ({
      ...input,
      urlJSON: JSON.stringify(input.url),
      keyJSON: JSON.stringify(input.key),
      valueJSON: JSON.stringify(input.value),
    })),
  )(
    'Should add query parameter $keyJSON=$valueJSON to $urlJSON',
    ({ url, key, value }) => {
      // act
      const actual = queryparam(url, key, value);

      // assert
      expect(actual).toMatchSnapshot();
    },
  );
});
