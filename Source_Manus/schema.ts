import { pgTable, varchar, timestamp, boolean, decimal, integer, jsonb, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================
// TABELA: organizations
// Armazena as organizações (tenants)
// ============================================
export const organizations = pgTable("organizations", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  settings: jsonb("settings"),
  active: boolean("active").default(true).notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

// ============================================
// TABELA: users
// Armazena todos os usuários (Super Admin, Org Admin, CSM)
// ============================================
export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull(), // SUPER_ADMIN | ORG_ADMIN | CSM
  organizationId: varchar("organization_id", { length: 255 }).references(() => organizations.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  active: boolean("active").default(true).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================
// TABELA: clients
// Armazena os clientes de cada organização
// ============================================
export const clients = pgTable("clients", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  organizationId: varchar("organization_id", { length: 255 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
  industry: varchar("industry", { length: 255 }),
  size: varchar("size", { length: 50 }),
  website: varchar("website", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

// ============================================
// TABELA: accounts
// Armazena os accounts (contas de clientes)
// ============================================
export const accounts = pgTable("accounts", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  organizationId: varchar("organization_id", { length: 255 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
  clientId: varchar("client_id", { length: 255 }).references(() => clients.id, { onDelete: "set null" }),
  mrr: decimal("mrr", { precision: 10, scale: 2 }).default("0"),
  healthScore: integer("health_score").default(0),
  status: varchar("status", { length: 50 }).default("healthy"),
  csm: varchar("csm", { length: 255 }),
  onboardingDate: timestamp("onboarding_date"),
  renewalDate: timestamp("renewal_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;

// ============================================
// TABELA: activities
// Armazena as atividades (interações com clientes)
// ============================================
export const activities = pgTable("activities", {
  id: varchar("id", { length: 255 }).primaryKey(),
  organizationId: varchar("organization_id", { length: 255 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
  accountId: varchar("account_id", { length: 255 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // call | email | meeting | note | task
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  status: varchar("status", { length: 50 }).default("pending"), // pending | in_progress | completed | cancelled
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;

// ============================================
// TABELA: tasks
// Armazena as tarefas
// ============================================
export const tasks = pgTable("tasks", {
  id: varchar("id", { length: 255 }).primaryKey(),
  organizationId: varchar("organization_id", { length: 255 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
  accountId: varchar("account_id", { length: 255 }).references(() => accounts.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("pending"), // pending | in_progress | completed
  priority: varchar("priority", { length: 50 }).default("medium"), // low | medium | high
  dueDate: timestamp("due_date"),
  assignedTo: varchar("assigned_to", { length: 255 }),
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

// ============================================
// TABELA: playbooks
// Armazena os playbooks (templates de processos)
// ============================================
export const playbooks = pgTable("playbooks", {
  id: varchar("id", { length: 255 }).primaryKey(),
  organizationId: varchar("organization_id", { length: 255 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  category: varchar("category", { length: 255 }),
  tags: jsonb("tags"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: varchar("created_by", { length: 255 }),
});

export type Playbook = typeof playbooks.$inferSelect;
export type InsertPlaybook = typeof playbooks.$inferInsert;

// ============================================
// RELAÇÕES (para queries com joins)
// ============================================
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  clients: many(clients),
  accounts: many(accounts),
  activities: many(activities),
  tasks: many(tasks),
  playbooks: many(playbooks),
}));

export const usersRelations = relations(users, ({ one }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [clients.organizationId],
    references: [organizations.id],
  }),
  accounts: many(accounts),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [accounts.organizationId],
    references: [organizations.id],
  }),
  client: one(clients, {
    fields: [accounts.clientId],
    references: [clients.id],
  }),
  activities: many(activities),
  tasks: many(tasks),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  organization: one(organizations, {
    fields: [activities.organizationId],
    references: [organizations.id],
  }),
  account: one(accounts, {
    fields: [activities.accountId],
    references: [accounts.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  organization: one(organizations, {
    fields: [tasks.organizationId],
    references: [organizations.id],
  }),
  account: one(accounts, {
    fields: [tasks.accountId],
    references: [accounts.id],
  }),
}));

export const playbooksRelations = relations(playbooks, ({ one }) => ({
  organization: one(organizations, {
    fields: [playbooks.organizationId],
    references: [organizations.id],
  }),
}));
