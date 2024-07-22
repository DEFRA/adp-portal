/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.table('delivery_project', function (table) {
    table.string('delivery_project_code').unique().alter();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.table('delivery_project', function (table) {
    table.dropUnique('delivery_project_code');
  });
};
