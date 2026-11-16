import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const workshopRequests = pgTable(
  'workshop_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyName: text('company_name').notNull(),
    workshopSize: text('workshop_size').notNull(),
    governorate: text('governorate').notNull(),
    city: text('city').notNull(),
    address: text('address').notNull(),
    status: text('status').notNull().default('pending'),
    submittedAt: timestamp('submitted_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'date' }),
    reviewedBy: text('reviewed_by'),
  },
  (table) => [index('workshop_requests_status_submitted_idx').on(table.status, table.submittedAt)],
)

export const workshopRequestAttachments = pgTable(
  'workshop_request_attachments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    requestId: uuid('request_id').notNull(),
    pathname: text('pathname').notNull(),
    filename: text('filename').notNull(),
    contentType: text('content_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('workshop_request_attachments_pathname_idx').on(table.pathname),
    index('workshop_request_attachments_request_idx').on(table.requestId),
  ],
)

export const marketplaceProducts = pgTable(
  'marketplace_products',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    requestId: uuid('request_id').notNull(),
    name: text('name').notNull(),
    maker: text('maker').notNull(),
    category: text('category').notNull(),
    price: text('price'),
    quantity: integer('quantity').notNull(),
    imageUrl: text('image_url').notNull(),
    description: text('description'),
    published: boolean('published').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [index('marketplace_products_published_created_idx').on(table.published, table.createdAt)],
)
