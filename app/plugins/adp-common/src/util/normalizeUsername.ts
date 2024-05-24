export function normalizeUsername(name: string): string {
  // Implementation based on Backstage's implementation - importing this
  // causes startup errors as trying to pull a backend module in to a front end.
  // https://github.com/backstage/backstage/blob/master/plugins/catalog-backend-module-msgraph/src/microsoftGraph/helper.ts
  let cleaned = name
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-zA-Z0-9_\-.]/g, '_');

  cleaned = cleaned.replace(/(?<=^|[^_])_+$/g, '');
  cleaned = cleaned.replaceAll(/__+/g, '_');

  return cleaned;
}
