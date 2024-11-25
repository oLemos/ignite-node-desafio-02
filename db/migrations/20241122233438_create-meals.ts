import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('meals', (table) => {
    table.uuid('id').primary()
    table
      .uuid('session_id')
      .references('session_id')
      .inTable('users')
      .onDelete('CASCADE')
      .notNullable()
      .index()
    table.text('name').notNullable()
    table.text('description').nullable()
    table.dateTime('dateTime').notNullable()
    table.boolean('isOnDiet').notNullable()
    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('meals')
}
