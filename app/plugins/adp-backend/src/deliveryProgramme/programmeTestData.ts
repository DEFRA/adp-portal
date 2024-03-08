export const expectedProgrammeData = {
  programme_managers: [],
  title: 'Test title expectedProgrammeData',
  alias: 'Test Alias',
  description: 'Test description',
  finance_code: 'Test finance_code',
  delivery_programme_code: 'Test delivery_programme_code',
  url: 'Test url',
};

export const expectedProgrammeDataWithManager = {
  programme_managers: [
    {
      aad_entity_ref_id: 'test id 1',
      email: 'test1@email.com',
      name: 'test 1',
    },
    {
      aad_entity_ref_id: 'test id 2',
      email: 'test2@email.com',
      name: 'test 2',
    },
    {
      aad_entity_ref_id: 'test id 3',
      email: 'test3@email.com',
      name: 'test 3',
    },
  ],
  title: 'Test title expectedProgrammeDataWithManager',
  alias: 'Test Alias',
  description: 'Test description',
  finance_code: 'Test finance_code',
  delivery_programme_code: 'Test delivery_programme_code',
  url: 'Test url',
  name: 'test-title-expectedprogrammedatawithmanager',
};

export const expectedProgrammeDataWithName = {
  programme_managers: [],
  title: 'Test title expectedProgrammeDataWithName',
  alias: 'Test Alias',
  description: 'Test description',
  finance_code: 'Test finance_code',
  delivery_programme_code: 'Test delivery_programme_code',
  url: 'Test url',
  name: 'test-title-expectedprogrammedatawithname',
};

export const expectedProgrammeDataWithoutManager = {
  title: 'Test title expectedProgrammeDataWithoutManager',
  alias: 'Test Alias',
  description: 'Test description',
  finance_code: 'Test finance_code',
  delivery_programme_code: 'Test delivery_programme_code',
  url: 'Test url',
  updated_by: 'john',
  name: 'test-title-expectedprogrammewithoutmanager',
};
