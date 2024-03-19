

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  let now = new Date()
  // await knex('arms_length_body').del()
  console.log("Hello")

  let result = await knex('arms_length_body').count("id").first()
 // console.log('Result', result)
  let count = result['count(\`id\`)']

  console.log('Count', count)
  if(count === 0) {
    await knex('arms_length_body').insert([
      {  creator: 'john',      owner: 'john',title: 'ALB Example 1', alias: 'ALB 1', description: 'This is an example ALB 1', url: 'http://www.example.com/index.html', name: 'alb-example-1', updated_by: 'john', created_at: now, updated_at:now},
      {  creator: 'john',      owner: 'john',title: 'ALB Example 1', alias: 'ALB 1', description: 'This is an example ALB 1', url: 'http://www.example.com/index.html', name: 'alb-example-1', updated_by: 'john', created_at: now, updated_at:now},
      {  creator: 'john',      owner: 'john',title: 'ALB Example 1', alias: 'ALB 1', description: 'This is an example ALB 1', url: 'http://www.example.com/index.html', name: 'alb-example-1', updated_by: 'john', created_at: now, updated_at:now},
    ]);
    console.log("Inserted Data")
  } else {
    console.log("Database not empty")
  }

};
