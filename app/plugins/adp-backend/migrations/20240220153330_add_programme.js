/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  return knex.schema.createTable('delivery_programme', table => {
    table.comment('Stores Delivery Programme data');
    table
      .string('name')
      .notNullable()
      .comment('Delivery Programme title in lower case and hyphens instead of spaces');
    table
      .string('title')
      .notNullable()
      .comment('Delivery Programme title');
    table
      .string('alias')
      .nullable()
      .comment('Alias of Delivery Programme');
    table
      .string('description')
      .notNullable()
      .comment('Description of the Delivery Programme');
    table
      .string('finance_code')
      .nullable()
      .comment('Finance code of Delivery Programme');
    table
      .uuid('arms_length_body_id')
      .notNullable()
      .comment('ID of the ALB owning the delivery programme');
    table
      .foreign('arms_length_body_id').references('id').inTable('arms_length_body')
    table
      .string('delivery_programme_code')
      .notNullable()
      .comment('Delivery programme code');
    table
      .string('url')
      .nullable()
      .comment('Delivery Programme URL');
    table
      .timestamp('created_at', { useTz: false })
      .notNullable()
      .defaultTo(knex.fn.now())
      .comment('Creation time of the Delivery Programme');
    table
      .uuid('id')
      .primary()
      .defaultTo(knex.fn.uuid())
      .comment('Auto-generated Delivery Programme ID');
    table
      .timestamp('updated_at', { useTz: false })
      .notNullable()
      .defaultTo(knex.fn.now())
      .comment('Date/time when the programme was last updated');
    table
      .string('updated_by')
      .notNullable()
      .comment(
        'Username of the person who last updated the Delivery Programme',
      );
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  return knex.schema.dropTable('delivery_programme');
};
