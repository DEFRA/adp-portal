/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  return knex.schema.createTable('arms_length_body', table => {
    table.comment('Stores ALB data');
    table
      .string('creator_username')
      .notNullable()
      .comment('Username of the ALB creator');
    table
      .string('creator_email')
      .notNullable()
      .comment('Email of the ALB creator');
    table
      .string('owner_username')
      .notNullable()
      .comment('Username of the ALB owner');
    table
      .string('owner_email')
      .notNullable()
      .comment('Email of the ALB owner');
    table
      .boolean('creator_same_as_owner')
      .notNullable()
      .comment('Is creator details the same as the owner details');
    table
      .string('name')
      .notNullable()
      .comment('ALB name');
    table
      .string('short_name')
      .notNullable()
      .comment('Short form of ALB name');
    table
      .string('description')
      .nullable()
      .comment('Description of the ALB');
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
      .string('created_by')
      .notNullable()
      .comment('Username of the person who created the ALB');
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
  return knex.schema.dropTable('armsLengthBody');
};
