/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  return knex.schema.createTable('delivery_programmes', table => {
    table.comment('Stores delivery programme data');
    table
      .uuid('id')
      .primary()
      .defaultTo(knex.fn.uuid())
      .comment('Auto-generated Delivery programme ID');
    table.string('name').notNullable().comment('Deliver programme name');
    table
      .string('arms_length_body')
      .notNullable()
      .comment('Name of the ALB owning the delivery programme');
    table
      .integer('programme_code')
      .notNullable()
      .comment('Delivery programme code');
    table
      .string('description')
      .nullable()
      .comment('Description of the delivery programme');
    table
      .timestamp('created_at', { useTz: false })
      .notNullable()
      .defaultTo(knex.fn.now())
      .comment('Creation time of the delivery programme');
    table
      .string('created_by')
      .notNullable()
      .comment('Username of the person who created the delivery programme');
    table
      .timestamp('updated_at', { useTz: false })
      .notNullable()
      .defaultTo(knex.fn.now())
      .comment('Date/time when the programme was last updated');
    table
      .string('updated_by')
      .notNullable()
      .comment(
        'Username of the person who last updated the delivery programme',
      );
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  return knex.schema.dropTable('deliveryProgrammes');
};
