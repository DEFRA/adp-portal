import { DeliveryProgramme } from '@internal/plugin-adp-common';

export const isNameUnique = (
  data: DeliveryProgramme[],
  title: string,
  id: string,
) => {
  return !data.some(
    item => item.title.toLowerCase() === title.toLowerCase() && item.id !== id,
  );
};

export const isCodeUnique = (
  data: DeliveryProgramme[],
  code: string,
  id: string,
) => {
  return !data.some(
    item =>
      item.delivery_programme_code.toLowerCase() === code.toLowerCase() &&
      item.id !== id,
  );
};