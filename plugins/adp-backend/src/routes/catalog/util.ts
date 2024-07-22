export function createTransformerTitle(title: string, alias?: string) {
  const titleValue = alias ? `${title} ` + `(${alias})` : title;
  return titleValue;
}
