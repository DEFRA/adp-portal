/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable(
    'delivery_project_github_teams',
    function (table) {
      table.comment('Stores references to github teams for delivery projects');
      table
        .uuid('id')
        .primary()
        .defaultTo(knex.fn.uuid())
        .comment('Auto-generated ID');
      table
        .uuid('delivery_project_id')
        .notNullable()
        .comment('ID of the Delivery Project the Github Team is assigned to');
      table
        .foreign('delivery_project_id')
        .references('id')
        .inTable('delivery_project');
      table
        .integer('github_team_id')
        .notNullable()
        .comment('ID of the team in github');
      table.string('team_type').notNullable().comment('The type of the team');
      table.string('team_name').notNullable().comment('The name of the team');
      table.unique(['delivery_project_id', 'team_type']);
    },
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('delivery_project_github_teams');
};
