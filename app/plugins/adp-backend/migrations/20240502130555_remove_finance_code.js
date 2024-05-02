/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('delivery_programme', function (table) {
    table.dropColumn('finance_code');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  knex.schema.alterTable('delivery_programme', function (table) {
    table
      .string('finance_code')
      .nullable()
      .comment('Finance code of Delivery Programme');
  });
};
