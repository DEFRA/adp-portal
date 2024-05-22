/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.table('delivery_project_user', function (table) {
    table
      .string('aad_user_principal_name')
      .nullable()
      .comment('User Principal Name identifier from Entra ID');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.table('delivery_project_user', function (table) {
    table.dropColumn('aad_user_principal_name');
  });
};
