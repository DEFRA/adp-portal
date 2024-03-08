/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  return knex.schema.createTable('delivery_programme_pm', table => {
    table.comment('Stores Programme Managers');
    table
      .uuid('id')
      .primary()
      .defaultTo(knex.fn.uuid())
      .comment('Auto-generated ID');
    table
      .uuid('delivery_programme_id')
      .notNullable()
      .comment('ID of the Delivery Programme the Programme Manager is assigned to');
    table
      .foreign('delivery_programme_id').references('id').inTable('delivery_programme')
    table
      .string('aad_entity_ref_id')
      .notNullable()
      .comment('ID AAD entity ref');
    table
      .string('email')
      .notNullable()
      .comment('Email of programme manager');
    table
      .string('name')
      .notNullable()
      .comment('Name of programme manager');
  })}

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
    return knex.schema.dropTable('delivery_programme_pm');
  };