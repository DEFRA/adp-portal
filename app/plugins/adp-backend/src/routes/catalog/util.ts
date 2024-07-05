export function createTransformerTitle(title: string, alias?: string) {
  const titleValue = alias ? `${title} ` + `(${alias})` : title;
  return titleValue;
}
export const ARMS_LENGTH_BODY_ID_ANNOTATION =
  'adp.defra.gov.uk/arms-length-body-id';
export const DELIVERY_PROGRAMME_ID_ANNOTATION =
  'adp.defra.gov.uk/delivery-programme-id';
export const DELIVERY_PROJECT_ID_ANNOTATION =
  'adp.defra.gov.uk/delivery-project-id';
