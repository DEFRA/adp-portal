/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.table('delivery_project', function (table) {
    table.string('url').comment('Delivery Project Namespace').alter();
    table.renameColumn('url', 'namespace');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.table('delivery_project', function (table) {
    table.string('namespace').comment('Delivery Project URL').alter();
    table.renameColumn('namespace', 'url');
  });
};
