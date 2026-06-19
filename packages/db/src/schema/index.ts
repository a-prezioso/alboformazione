import {
  pgSchema,
  uuid,
  text,
  boolean,
  integer,
  serial,
  numeric,
  timestamp,
  date,
  jsonb,
  primaryKey,
  uniqueIndex
} from 'drizzle-orm/pg-core';

export const albo = pgSchema('alboformazione');

// ── Identity & profile ────────────────────────────────────────────────────────
export const users = albo.table('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  displayName: text('display_name'),
  ssoSubject: text('sso_subject'),
  isSuperAdmin: boolean('is_super_admin').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true })
});

export const memberships = albo.table('memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  status: text('status').notNull().default('non_associato'), // associato | non_associato
  economicTier: text('economic_tier').notNull().default('standard'),
  validFrom: date('valid_from'),
  validTo: date('valid_to'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const roles = albo.table('roles', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  label: text('label').notNull()
});

export const userRoles = albo.table('user_roles', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: integer('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' })
}, (t) => ({ pk: primaryKey({ columns: [t.userId, t.roleId] }) }));

// ── Catalog & content ──────────────────────────────────────────────────────────
export const contents = albo.table('contents', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  summary: text('summary'),
  description: text('description'),
  contentType: text('content_type').notNull().default('ondemand'), // live | ondemand | extra
  extraKind: text('extra_kind'),
  category: text('category'),
  level: text('level'), // base | intermedio | avanzato
  certifying: boolean('certifying').notNull().default(false),
  creditsLive: numeric('credits_live', { precision: 5, scale: 2 }).notNull().default('0'),
  creditsOndemand: numeric('credits_ondemand', { precision: 5, scale: 2 }).notNull().default('0'),
  minViewPct: integer('min_view_pct').notNull().default(80),
  durationMin: integer('duration_min'),
  coverUrl: text('cover_url'),
  videoKey: text('video_key'),
  status: text('status').notNull().default('draft'), // draft | published | archived
  creditsActiveFrom: timestamp('credits_active_from', { withTimezone: true }),
  authorId: uuid('author_id').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const contentMaterials = albo.table('content_materials', {
  id: uuid('id').primaryKey().defaultRandom(),
  contentId: uuid('content_id').notNull().references(() => contents.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  fileKey: text('file_key').notNull(),
  kind: text('kind').notNull().default('document'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const paths = albo.table('paths', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('draft'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const pathItems = albo.table('path_items', {
  pathId: uuid('path_id').notNull().references(() => paths.id, { onDelete: 'cascade' }),
  contentId: uuid('content_id').notNull().references(() => contents.id, { onDelete: 'cascade' }),
  position: integer('position').notNull().default(0)
}, (t) => ({ pk: primaryKey({ columns: [t.pathId, t.contentId] }) }));

// ── Live events ──────────────────────────────────────────────────────────────
export const liveEvents = albo.table('live_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  contentId: uuid('content_id').notNull().references(() => contents.id, { onDelete: 'cascade' }),
  zoomMeetingId: text('zoom_meeting_id'),
  joinUrl: text('join_url'),
  startAt: timestamp('start_at', { withTimezone: true }).notNull(),
  endAt: timestamp('end_at', { withTimezone: true }),
  status: text('status').notNull().default('scheduled'), // scheduled | live | ended
  recordingKey: text('recording_key'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const liveAttendance = albo.table('live_attendance', {
  id: uuid('id').primaryKey().defaultRandom(),
  liveEventId: uuid('live_event_id').notNull().references(() => liveEvents.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  joinedAt: timestamp('joined_at', { withTimezone: true }),
  leftAt: timestamp('left_at', { withTimezone: true }),
  minutes: integer('minutes').notNull().default(0),
  credited: boolean('credited').notNull().default(false)
}, (t) => ({ uniq: uniqueIndex('live_attendance_event_user_uk').on(t.liveEventId, t.userId) }));

// ── On-demand viewing progress ─────────────────────────────────────────────────
export const viewProgress = albo.table('view_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  contentId: uuid('content_id').notNull().references(() => contents.id, { onDelete: 'cascade' }),
  watchedPct: integer('watched_pct').notNull().default(0),
  lastPositionSec: integer('last_position_sec').notNull().default(0),
  completed: boolean('completed').notNull().default(false),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (t) => ({ uniq: uniqueIndex('view_progress_user_content_uk').on(t.userId, t.contentId) }));

// ── Unlock test ────────────────────────────────────────────────────────────────
export const quizzes = albo.table('quizzes', {
  id: uuid('id').primaryKey().defaultRandom(),
  contentId: uuid('content_id').notNull().references(() => contents.id, { onDelete: 'cascade' }).unique(),
  passPct: integer('pass_pct').notNull().default(100),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const quizQuestions = albo.table('quiz_questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  quizId: uuid('quiz_id').notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
  prompt: text('prompt').notNull(),
  options: jsonb('options').notNull().default([]),
  correctIndex: integer('correct_index').notNull().default(0),
  position: integer('position').notNull().default(0)
});

export const quizAttempts = albo.table('quiz_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  quizId: uuid('quiz_id').notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  scorePct: integer('score_pct').notNull().default(0),
  passed: boolean('passed').notNull().default(false),
  answers: jsonb('answers').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

// ── Credits & certificates ──────────────────────────────────────────────────────
export const creditLedger = albo.table('credit_ledger', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  contentId: uuid('content_id').references(() => contents.id, { onDelete: 'set null' }),
  mode: text('mode').notNull(), // live | ondemand
  credits: numeric('credits', { precision: 5, scale: 2 }).notNull().default('0'),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const certificates = albo.table('certificates', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  contentId: uuid('content_id').notNull().references(() => contents.id, { onDelete: 'cascade' }),
  credits: numeric('credits', { precision: 5, scale: 2 }).notNull().default('0'),
  serial: text('serial').notNull().unique(),
  pdfKey: text('pdf_key'),
  issuedAt: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow()
}, (t) => ({ uniq: uniqueIndex('certificates_user_content_uk').on(t.userId, t.contentId) }));

// ── E-commerce ──────────────────────────────────────────────────────────────────
export const products = albo.table('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  kind: text('kind').notNull().default('content'), // content | path | package
  contentId: uuid('content_id').references(() => contents.id, { onDelete: 'cascade' }),
  pathId: uuid('path_id').references(() => paths.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  priceMember: numeric('price_member', { precision: 8, scale: 2 }).notNull().default('0'),
  priceNonMember: numeric('price_non_member', { precision: 8, scale: 2 }).notNull().default('0'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const orders = albo.table('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('pending'), // pending | paid | cancelled
  total: numeric('total', { precision: 8, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  paidAt: timestamp('paid_at', { withTimezone: true })
});

export const orderItems = albo.table('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id),
  unitPrice: numeric('unit_price', { precision: 8, scale: 2 }).notNull().default('0'),
  qty: integer('qty').notNull().default(1)
});

export const entitlements = albo.table('entitlements', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  contentId: uuid('content_id').references(() => contents.id, { onDelete: 'cascade' }),
  pathId: uuid('path_id').references(() => paths.id, { onDelete: 'cascade' }),
  source: text('source').notNull().default('purchase'), // purchase | grant | membership
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().defaultNow()
});

// ── CFP obligation, member details, notifications (expansion) ───────────────────
export const cfpRules = albo.table('cfp_rules', {
  year: integer('year').primaryKey(),
  requiredAnnual: numeric('required_annual', { precision: 6, scale: 2 }).notNull().default('0'),
  triennioLabel: text('triennio_label'),
  requiredTriennio: numeric('required_triennio', { precision: 6, scale: 2 })
});

export const memberDetails = albo.table('member_details', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  fiscalCode: text('fiscal_code'),
  profession: text('profession'),
  registrationNumber: text('registration_number'),
  phone: text('phone'),
  city: text('city'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const notifications = albo.table('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull().default('info'),
  title: text('title').notNull(),
  body: text('body'),
  link: text('link'),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const emailLog = albo.table('email_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  recipient: text('recipient').notNull(),
  subject: text('subject'),
  status: text('status').notNull().default('sent'), // sent | failed | skipped
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

// ── Audit ───────────────────────────────────────────────────────────────────────
export const auditLog = albo.table('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorEmail: text('actor_email'),
  action: text('action').notNull(),
  entity: text('entity'),
  entityId: text('entity_id'),
  meta: jsonb('meta').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});
