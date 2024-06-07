interface TextCase {
  toWords(input: string): string[];
  fromWords(words: string[]): string;
}

function splitBy(separator: string): TextCase {
  return {
    toWords(input) {
      return input.split(separator).map(w => w.toLowerCase());
    },
    fromWords(words) {
      return words.map(w => w.toLowerCase()).join(separator);
    },
  };
}

const core = {
  pascal: {
    toWords(input) {
      return input.split(/(?=[A-Z])/g).map(w => w.toLowerCase());
    },
    fromWords(words) {
      return words
        .map(w => w[0].toUpperCase() + w.slice(1).toLowerCase())
        .join('');
    },
  },
  sentence: splitBy(' '),
  kebab: splitBy('-'),
  snake: splitBy('_'),
  dot: splitBy('.'),
} satisfies Record<string, TextCase>;

export const textCases = {
  ...core,
  camel: {
    toWords(input) {
      return core.pascal.toWords(input);
    },
    fromWords(words) {
      const result = core.pascal.fromWords(words);
      return result[0].toLowerCase() + result.slice(1);
    },
  },
} as const satisfies Record<string, TextCase>;
