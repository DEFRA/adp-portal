/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.table('delivery_project', function (table) {
    table
      .string('team_type')
      .notNullable()
      .defaultTo('delivery')
      .comment(
        'Team type of the delivery project. Possible values are delivery or platform',
      );
    table
      .string('service_owner')
      .notNullable()
      .defaultTo('placeholder@example.com')
      .comment(
        'Email address of the business service owner of the delivery project',
      );
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.table('delivery_project', function (table) {
    table.dropColumn('team_type');
    table.dropColumn('service_owner');
  });
};
