/**
 * Builds a title from a human readable name and acronym.
 * @param title The human readable title of the entity
 * @param alias An acronym form of the title
 * @returns A string containing the title and short name
 */
export function createTransformerTitle(title: string, alias?: string) {
  const titleValue = alias ? title + ' ' + `(${alias})` : title;
  return titleValue;
}
