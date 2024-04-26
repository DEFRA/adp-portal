export const ProgrammeAdminFormFields = [
    {
      label: 'Delivery Programme',
      name: 'delivery_programme_id',
      disabled: true,
    },
    {
      label: 'Programme Admin',
      name: 'programme_managers',
      helperText: 'Select all Programme Admins for this Programme',
      validations: {
        required: true,
      },
      select: true,
      multiple: true,
    },
  ];
  