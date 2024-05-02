/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('arms_length_body', function (table) {
    table.unique('name');
    table.unique('title');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  knex.schema.alterTable('arms_length_body', function (table) {
    table.dropUnique('name');
    table.dropUnique('title');
  });
};
