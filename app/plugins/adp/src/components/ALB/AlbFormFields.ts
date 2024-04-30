export const albFormFields = [
    {
      label: 'Title',
      name: 'title',
      helperText:
        'This must be unique',
      validations: {
        required: true,
      },
    },
    {
      label: 'Alias',
      name: 'alias',
      helperText: 'Optional - an alias to identify the body',
    },
    {
      label: 'Website',
      name: 'url',
      helperText: 'Optional - a link to website',
    },
    {
      label: 'ALB Description',
      name: 'description',
      helperText: 'Max 200 Chars',
      validations: {
        required: true,
        maxLength: 200,
      },
      multiline: true,
      maxRows: 4,
    },
  ];