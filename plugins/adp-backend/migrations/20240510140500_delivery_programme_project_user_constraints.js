/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .alterTable('delivery_programme_admin', function (table) {
      table.unique(['delivery_programme_id', 'aad_entity_ref_id']);
    })
    .alterTable('delivery_project_user', function (table) {
      table.unique(['delivery_project_id', 'aad_entity_ref_id']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .alterTable('delivery_project', function (table) {
      table.dropUnique(['delivery_programme_id', 'aad_entity_ref_id']);
    })
    .alterTable('delivery_project_user', function (table) {
      table.dropUnique(['delivery_project_id', 'aad_entity_ref_id']);
    });
};
