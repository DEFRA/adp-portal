/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  return knex.schema.createTable('arms_length_body', table => {
    table.comment('Stores ALB data');
    table
      .string('creator')
      .notNullable()
      .comment('Username of the ALB creator');
    table
      .string('owner')
      .notNullable()
      .comment('Username of the ALB owner');
    table
      .string('name')
      .notNullable()
      .comment('ALB name in lower case and hyphens instead of spaces');
    table
      .string('title')
      .notNullable()
      .comment('ALB name');
    table
      .string('short_name')
      .nullable()
      .comment('Short form of ALB name');
    table
      .string('description')
      .notNullable()
      .comment('Description of the ALB');
    table
      .string('url')
      .nullable()
      .comment('ALB URL');
    table
      .timestamp('created_at', { useTz: false })
      .notNullable()
      .defaultTo(knex.fn.now())
      .comment('Creation time of the ALB');
    table
      .uuid('id')
      .primary()
      .defaultTo(knex.fn.uuid())
      .comment('Auto-generated ALB ID');
    table
      .timestamp('updated_at', { useTz: false })
      .notNullable()
      .defaultTo(knex.fn.now())
      .comment('Date/time when the programme was last updated');
    table
      .string('updated_by')
      .notNullable()
      .comment(
        'Username of the person who last updated the ALB',
      );
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  return knex.schema.dropTable('arms_length_body');
};
