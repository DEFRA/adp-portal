/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('delivery_programme', function (table) {
    table.unique('name');
    table.unique('title');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  knex.schema.alterTable('delivery_programme', function (table) {
    table.dropUnique('name');
    table.dropUnique('title');
  });
};
