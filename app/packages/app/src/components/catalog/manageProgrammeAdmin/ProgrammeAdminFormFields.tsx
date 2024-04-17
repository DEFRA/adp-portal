export const ProgrammeAdminFormFields = [
    {
      label: 'Delivery Programme',
      name: 'delivery_programme_id',
    },
    {
      label: 'Programme Managers',
      name: 'programme_managers',
      validations: {
        required: true,
      },
      select: true,
      multiple: true,
    },
  ];
  