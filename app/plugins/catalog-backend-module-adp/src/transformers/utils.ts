/**
 * Builds a title from a human readable name and acronym.
 * @param title The human readable title of the entity
 * @param short_name An acronym form of the title
 * @returns A string containing the title and short name
 */
export function createTitle(title: string, short_name?: string) {
  const titleValue = short_name ? title + ' ' + `(${short_name})` : title;
  return titleValue;
}
