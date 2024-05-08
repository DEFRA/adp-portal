/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('delivery_project', function (table) {
    table.unique('name');
    table.unique(['delivery_programme_id', 'title']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  knex.schema.alterTable('delivery_project', function (table) {
    table.dropUnique('name');
    table.dropUnique(['delivery_programme_id', 'title']);
  });
};
