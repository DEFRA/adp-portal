import * as urlSlug from 'url-slug';

export function createName(name: string) {
  const nameConversion = urlSlug.convert(name.toLowerCase(), {
    separator: '-',
    transformer: (fragments, separator) =>
      fragments
        .map(fragment => fragment.replace(/[^a-zA-Z0-9._-]/g, ''))
        .join(separator),
  });
  const nameValue = nameConversion.substring(0, 64);
  return nameValue;
}
