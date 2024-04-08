import { DeliveryProject } from '@internal/plugin-adp-common';

export const isNameUnique = (
  data: DeliveryProject[],
  title: string,
  id: string,
) => {
  return !data.some(
    item => item.title.toLowerCase() === title.toLowerCase() && item.id !== id,
  );
};

export const isCodeUnique = (
  data: DeliveryProject[],
  code: string,
  id: string,
) => {
  return !data.some(
    item =>
      item.delivery_project_code.toLowerCase() === code.toLowerCase() &&
      item.id !== id,
  );
};
