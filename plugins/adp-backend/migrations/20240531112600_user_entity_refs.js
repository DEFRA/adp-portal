/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .table('delivery_project_user', function (table) {
      table
        .string('user_entity_ref')
        .nullable()
        .comment('Backstage user entity ref');
    })
    .table('delivery_programme_admin', function (table) {
      table
        .string('user_entity_ref')
        .nullable()
        .comment('Backstage user entity ref');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .table('delivery_project_user', function (table) {
      table.dropColumn('user_entity_ref');
    })
    .table('delivery_programme_admin', function (table) {
      table.dropColumn('user_entity_ref');
    });
};
