const TABLE_NAME = 'delivery_programme';

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
      await knex(TABLE_NAME).insert(await resolveReferences(record));
    }
  }

  async function resolveReferences(record) {
    const albId = await knex('arms_length_body')
      .where('name', record.arms_length_body_id)
      .limit(1)
      .select('id');

    return {
      ...record,
      arms_length_body_id: albId[0].id,
    };
  }
};

const records = [
  {
    name: 'europe-trade',
    title: 'Europe & Trade',
    alias: 'EUTD',
    description: '',
    finance_code: null,
    arms_length_body_id: 'animal-plant-health-agency',
    delivery_programme_code: '',
    url: null,
    updated_by: 'ADP',
  },
  {
    name: 'coreai',
    title: 'Core AI',
    alias: 'CAI',
    description: '',
    finance_code: null,
    arms_length_body_id: 'core-defra',
    delivery_programme_code: '',
    url: null,
    updated_by: 'ADP',
  },
  {
    name: 'extended-producer-responsibility',
    title: 'Extended Producer Responsibility',
    alias: 'EPR',
    description: '',
    finance_code: null,
    arms_length_body_id: 'environment-agency',
    delivery_programme_code: '',
    url: null,
    updated_by: 'ADP',
  },
  {
    name: 'fisheries',
    title: 'Fisheries',
    alias: '',
    description: '',
    finance_code: null,
    arms_length_body_id: 'marine-management-organisation',
    delivery_programme_code: '',
    url: null,
    updated_by: 'ADP',
  },
  {
    name: 'biodiversity-net-gains',
    title: 'Biodiversity & Net Gains',
    alias: 'BNG',
    description: '',
    finance_code: null,
    arms_length_body_id: 'natural-england',
    delivery_programme_code: '',
    url: null,
    updated_by: 'ADP',
  },
  {
    name: 'farming-countryside-programme',
    title: 'Farming & Countryside Programme',
    alias: 'FCP',
    description: '',
    finance_code: null,
    arms_length_body_id: 'rural-payments-agency',
    delivery_programme_code: '',
    url: null,
    updated_by: 'ADP',
  },
  {
    name: 'legacy-applications-programme',
    title: 'Legacy Applications Programme',
    alias: 'LAP',
    description: '',
    finance_code: null,
    arms_length_body_id: 'rural-payments-agency',
    delivery_programme_code: '',
    url: null,
    updated_by: 'ADP',
  },
];
