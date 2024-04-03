export const DeliveryProjectFormFields = [
  {
    label: 'Title',
    name: 'title',
    helperText: 'This must be unique',
    validations: {
      required: true,
      pattern: {
        value: /^[a-zA-Z0-9]+(?:[. ][a-zA-Z0-9]+)*$/,
        message: 'Invalid delivery project name format',
      },
    },
  },
  {
    label: 'Alias',
    name: 'alias',
    helperText: 'Optional - an alias to identify the project',
  },
  {
    label: 'Delivery Project Description',
    name: 'description',
    helperText: 'Max 200 Chars',
    validations: {
      required: true,
      maxLength: 200,
    },
    multiline: true,
    maxRows: 4,
  },
  {
    label: 'Delivery Programme',
    name: 'delivery_programme_id',
    validations: {
      required: true,
    },
    select: true,
  },
  {
    label: 'Finance Code',
    name: 'finance_code',
  },
  {
    label: 'Delivery Project Code',
    name: 'delivery_project_code',
    validations: {
      required: true,
    },
  },
  {
    label: 'Website',
    name: 'url',
    helperText: 'Optional - a link to website',
  },
  {
    label: 'ADO Project',
    name: 'ado_project',
    helperText: 'Optional - name of the ADO project',
  },
];
