const TABLE_NAME = 'delivery_programme';

/**
 * @param {import('knex').Knex} knex
 */
exports.seed = async function seed(knex) {

  const recordsWithEmptyFields = await knex(TABLE_NAME)
  .select('name')
  .where(function() {
    this.where('description', '')
    .orWhere('delivery_programme_code', '')
});

  for (const record of records) {
    const [{ count }] = await knex(TABLE_NAME)
      .where('name', record.name)
      .limit(1)
      .count('*', { as: 'count' });
    if (parseInt(count) === 0) {
      await knex(TABLE_NAME).insert(await resolveReferences(record));
    }
    const recordsToUpdate = recordsWithEmptyFields.filter(d => d.name === record.name)
    if(recordsToUpdate.length > 0) {
      await knex(TABLE_NAME)
      .whereIn('name', recordsToUpdate)
      .update({
        description: record.description,
        delivery_programme_code: record.delivery_programme_code,
      })      
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
}

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
    description: 'EPR will move the full cost of dealing with packaging waste from households away from local taxpayers and councils to the packaging producers, giving producers responsibility for the costs of their packaging throughout its life cycle.',
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
    description: 'Biodiversity net gain (BNG) is a way of creating and improving natural habitats. BNG makes sure development has a measurably positive impact (‘net gain’) on biodiversity, compared to what was there before development.',
    finance_code: null,
    arms_length_body_id: 'natural-england',
    delivery_programme_code: 'BNG',
    url: null,
    updated_by: 'ADP',
  },
  {
    name: 'farming-countryside-programme',
    title: 'Farming & Countryside Programme',
    alias: 'FCP',
    description: 'The Farming and Countryside Programme is responsible for designing and delivering the new farming schemes in England.',
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
