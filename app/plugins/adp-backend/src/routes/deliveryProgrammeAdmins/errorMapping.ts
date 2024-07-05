export const errorMapping = {
  duplicateUser: (req: { user_catalog_name?: string }) => ({
    path: 'user_catalog_name',
    error: {
      message: `The user ${req.user_catalog_name} has already been added to this delivery programme`,
    },
  }),
  unknownDeliveryProgramme: () => ({
    path: 'delivery_programme_id',
    error: {
      message: `The delivery programme does not exist.`,
    },
  }),
  unknownCatalogUser: (req: { user_catalog_name?: string }) => ({
    path: 'user_catalog_name',
    error: {
      message: `The user ${req.user_catalog_name} could not be found in the Catalog`,
    },
  }),
  unknown: () => ({
    path: 'root',
    error: {
      message: `An unexpected error occurred.`,
    },
  }),
};
