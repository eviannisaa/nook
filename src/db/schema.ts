import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  role: text('role').$type<'user' | 'bot'>().notNull(),
  text: text('text').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
