/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  return knex.schema.createTable('delivery_project_user', table => {
    table.comment('Stores Delivery Project Users');
    table
      .uuid('id')
      .primary()
      .defaultTo(knex.fn.uuid())
      .comment('Auto-generated ID');
    table
      .uuid('delivery_project_id')
      .notNullable()
      .comment(
        'ID of the Delivery Project the Delivery Project User is assigned to',
      );
    table
      .foreign('delivery_project_id')
      .references('id')
      .inTable('delivery_project');
    table
      .boolean('is_technical')
      .notNullable()
      .defaultTo(false)
      .comment('Indicates whether the user is technical');
    table
      .boolean('is_admin')
      .notNullable()
      .defaultTo(false)
      .comment('Indicates whether the user is an admin');
    table
      .string('aad_entity_ref_id')
      .notNullable()
      .comment("The user's object ID in Entra ID");
    table.string('name').notNullable().comment('Name of project user');
    table.string('email').notNullable().comment('Email of project user');
    table.string('github_username').nullable().comment('GitHub Username');
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  return knex.schema.dropTable('delivery_project_user');
};
