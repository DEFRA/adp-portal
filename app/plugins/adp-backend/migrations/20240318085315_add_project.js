/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('delivery_project', table => {
        table.comment('Stores Delivery Project data');
        table
          .string('name')
          .notNullable()
          .comment('Delivery Project title in lower case and hyphens instead of spaces');
        table
          .string('title')
          .notNullable()
          .comment('Delivery Project title');
        table
          .string('alias')
          .nullable()
          .comment('Alias of Delivery Project');
        table
          .string('description')
          .notNullable()
          .comment('Description of the Delivery Project');
        table
          .string('finance_code')
          .nullable()
          .comment('Finance code of Delivery Project');
        table
          .uuid('delivery_programme_id')
          .notNullable()
          .comment('ID of the Delivery Programme owning the delivery Project');
        table
          .foreign('delivery_programme_id').references('id').inTable('delivery_programme')
        table
          .string('delivery_project_code')
          .notNullable()
          .comment('Delivery Project code');
        table
          .string('url')
          .nullable()
          .comment('Delivery Project URL');
        table
          .string('ado_project')
          .nullable()
          .comment('ADO project name of the Delivery Project');
        table
          .timestamp('created_at', { useTz: false })
          .notNullable()
          .defaultTo(knex.fn.now())
          .comment('Creation time of the Delivery Project');
        table
          .uuid('id')
          .primary()
          .defaultTo(knex.fn.uuid())
          .comment('Auto-generated Delivery Project ID');
        table
          .timestamp('updated_at', { useTz: false })
          .notNullable()
          .defaultTo(knex.fn.now())
          .comment('Date/time when the Project was last updated');
        table
          .string('updated_by')
          .notNullable()
          .comment(
            'Username of the person who last updated the Delivery Project',
          );
      });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTable('delivery_project');
};
