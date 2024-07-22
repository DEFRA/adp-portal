exports.up = function (knex) {
  return knex.schema.table('arms_length_body', function (table) {
    table.string('short_name').comment('Alias of ALB').alter();
    table.renameColumn('short_name', 'alias');
    table.string('owner').comment('AD group of the ALB owner').alter();
    table.string('title').comment('ALB title').alter();
    table
      .string('name')
      .comment('ALB title in lower case and hyphens instead of spaces')
      .alter();
  });
};

exports.down = function (knex) {
  return knex.schema.table('arms_length_body', function (table) {
    table.string('alias').comment('Short form of ALB name').alter();
    table.renameColumn('alias', 'short_name');
    table.string('owner').comment('Username of the ALB owner').alter();
    table.string('title').comment('ALB name').alter();
    table
      .string('name')
      .comment('ALB name in lower case and hyphens instead of spaces')
      .alter();
  });
};
