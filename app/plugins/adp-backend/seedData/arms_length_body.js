const TABLE_NAME = 'arms_length_body';

/**
 * @param {import('knex').Knex} knex
 */
exports.seed = async function seed(knex) {
  for (const record of records) {
    const [{ count }] = await knex(TABLE_NAME)
      .where('name', record.name)
      .limit(1)
      .count('*', { as: 'count' });
    if (parseInt(count) === 0) {
      await knex(TABLE_NAME).insert(record);
    }
  }
};

const records = [
  {
    creator: 'ADP',
    owner: 'ADP',
    title: 'Core DEFRA',
    alias: 'CD',
    name: 'core-defra',
    description:
      'UK government department responsible for safeguarding our natural environment, supporting our food & farming industry, and sustaining a thriving rural economy.',
    url: 'https://www.gov.uk/government/organisations/department-for-environment-food-rural-affairs/',
    updated_by: 'ADP',
  },
  {
    creator: 'ADP',
    owner: 'ADP',
    title: 'Environment Agency',
    alias: 'EA',
    name: 'environment-agency',
    description:
      'We work to create better places for people and wildlife, and support sustainable development.',
    url: 'https://www.gov.uk/government/organisations/environment-agency',
    updated_by: 'ADP',
  },
  {
    creator: 'ADP',
    owner: 'ADP',
    title: 'Animal & Plant Health Agency',
    alias: 'APHA',
    name: 'animal-plant-health-agency',
    description:
      'We work to safeguard animal and plant health for the benefit of people, the environment and the economy.',
    url: 'https://www.gov.uk/government/organisations/animal-and-plant-health-agency',
    updated_by: 'ADP',
  },
  {
    creator: 'ADP',
    owner: 'ADP',
    title: 'Rural Payments Agency',
    alias: 'RPA',
    name: 'rural-payments-agency',
    description:
      'We pay out over £2 billion each year to support a thriving farming and food sector, supporting agricultural and rural communities to create a better place to live.',
    url: 'https://www.gov.uk/government/organisations/rural-payments-agency',
    updated_by: 'ADP',
  },
  {
    creator: 'ADP',
    owner: 'ADP',
    title: 'Natural England',
    alias: 'NE',
    name: 'natural-england',
    description:
      "We're the government's adviser for the natural environment in England. We help to protect and restore our natural world.",
    url: 'https://www.gov.uk/government/organisations/natural-england',
    updated_by: 'ADP',
  },
  {
    creator: 'ADP',
    owner: 'ADP',
    title: 'Marine Management Organisation',
    alias: 'MMO',
    name: 'marine-management-organisation',
    description:
      'The Marine Management Organisation (MMO) was created in 2009 by the Marine and Coastal Access Act.',
    url: 'https://www.gov.uk/government/organisations/marine-management-organisation',
    updated_by: 'ADP',
  },
];
