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
    helperText:
      'Optional - Are there any other names this project team is also known as?',
  },
  {
    label: 'Delivery Project Description',
    name: 'description',
    helperText: 'Max 500 Chars',
    validations: {
      required: true,
      maxLength: 500,
    },
    multiline: true,
    maxRows: 4,
  },
  {
    label: 'Team Type',
    name: 'team_type',
    validations: {
      required: true,
    },
    select: true,
    disabled: true,
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
    label: 'Service Code',
    name: 'delivery_project_code',
    validations: {
      required: true,
      pattern: {
        value: /^[a-zA-Z]{3}$/,
        message:
          'Invalid service code - Must be only 3 characters long and unique',
      },
    },
    helperText: 'Can contain only alphabets with 3 characters and unique',
  },
  {
    label: 'Cost Center',
    name: 'finance_code',
  },
  {
    label: 'Business Service Owner',
    name: 'service_owner',
    helperText: 'Email address of the service owner',
    validations: {
      required: true,
      pattern: {
        value:
          /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        message: 'Invalid email address',
      },
    },
  },
  {
    label: 'Project Namespace',
    name: 'namespace',
    helperText:
      'It will not be possible to edit the namespace after the project team has been created',
    validations: {
      required: true,
    },
  },
  {
    label: 'ADO Project',
    name: 'ado_project',
    helperText: 'Name of the ADO project',
    validations: {
      required: true,
    },
  },
];
