import { pgTable, text, serial, integer, boolean, timestamp, numeric, decimal, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === TENANTS ===
export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city"),
  state: text("state"),
  urbanPercent: numeric("urban_percent").notNull().default("0"),
  tripPercent: numeric("trip_percent").notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tenantRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  vehicles: many(vehicles),
  employees: many(employees),
}));

// === USERS ===
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("OPERATOR"), // ADMIN, OPERATOR
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
}));

// === CATEGORIES ===
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  defaultType: text("default_type").notNull(), // INCOME, EXPENSE, BOTH
  isSystem: boolean("is_system").default(false),
});

// === ATTACHMENTS ===
export const attachments = pgTable("attachments", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  storagePath: text("storage_path").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === FINANCE TRANSACTIONS ===
export const financeTransactions = pgTable("finance_transactions", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  type: text("type").notNull(), // INCOME, EXPENSE
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  date: timestamp("date").notNull(),
  amount: numeric("amount").notNull(),
  description: text("description"),
  attachmentId: integer("attachment_id").references(() => attachments.id),
  invoiceId: integer("invoice_id"), // FK added later via relations or manual query
  employeePaymentId: integer("employee_payment_id"), // FK added later
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === INVOICES ===
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  number: text("number"),
  issueDate: timestamp("issue_date").notNull(),
  competenceMonth: text("competence_month").notNull(), // YYYY-MM
  periodType: text("period_type").notNull(), // A_01_15, B_16_END
  amount: numeric("amount").notNull(),
  status: text("status").notNull().default("ISSUED"), // ISSUED, SENT, PAID
  attachmentId: integer("attachment_id").references(() => attachments.id).notNull(), // Required
  financeTransactionId: integer("finance_transaction_id").references(() => financeTransactions.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === EMPLOYEES ===
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  position: text("position"),
  salary: numeric("salary").notNull(),
  payday: integer("payday").notNull(), // 1-31
  status: text("status").notNull().default("ACTIVE"), // ACTIVE, INACTIVE
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === EMPLOYEE PAYMENTS ===
export const employeePayments = pgTable("employee_payments", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  competenceMonth: text("competence_month").notNull(), // YYYY-MM
  paymentDate: timestamp("payment_date").notNull(),
  amount: numeric("amount").notNull(),
  status: text("status").notNull().default("PAID"),
  financeTransactionId: integer("finance_transaction_id").references(() => financeTransactions.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === VEHICLES ===
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  nickname: text("nickname").notNull(),
  plate: text("plate").notNull(),
  year: integer("year").notNull(),
  type: text("type").notNull(), // TRUCK_3X4, FIORINO, OTHER
  status: text("status").notNull().default("ACTIVE"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === LOADINGS ===
export const loadings = pgTable("loadings", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  date: timestamp("date").notNull(),
  type: text("type").notNull(), // URBAN, TRIP
  grossFreight: numeric("gross_freight").notNull(),
  appliedPercent: numeric("applied_percent").notNull(),
  estimatedRevenue: numeric("estimated_revenue").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const financeTransactionRelations = relations(financeTransactions, ({ one }) => ({
  category: one(categories, {
    fields: [financeTransactions.categoryId],
    references: [categories.id],
  }),
  attachment: one(attachments, {
    fields: [financeTransactions.attachmentId],
    references: [attachments.id],
  }),
}));

export const invoiceRelations = relations(invoices, ({ one }) => ({
  attachment: one(attachments, {
    fields: [invoices.attachmentId],
    references: [attachments.id],
  }),
  transaction: one(financeTransactions, {
    fields: [invoices.financeTransactionId],
    references: [financeTransactions.id],
  }),
}));

export const loadingRelations = relations(loadings, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [loadings.vehicleId],
    references: [vehicles.id],
  }),
}));

export const employeePaymentRelations = relations(employeePayments, ({ one }) => ({
  employee: one(employees, {
    fields: [employeePayments.employeeId],
    references: [employees.id],
  }),
  transaction: one(financeTransactions, {
    fields: [employeePayments.financeTransactionId],
    references: [financeTransactions.id],
  }),
}));


// === SCHEMAS ===
export const insertTenantSchema = createInsertSchema(tenants).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertAttachmentSchema = createInsertSchema(attachments).omit({ id: true, createdAt: true });
export const insertFinanceTransactionSchema = createInsertSchema(financeTransactions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEmployeePaymentSchema = createInsertSchema(employeePayments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertVehicleSchema = createInsertSchema(vehicles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLoadingSchema = createInsertSchema(loadings).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type Tenant = typeof tenants.$inferSelect;
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
export type FinanceTransaction = typeof financeTransactions.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type EmployeePayment = typeof employeePayments.$inferSelect;
export type Vehicle = typeof vehicles.$inferSelect;
export type Loading = typeof loadings.$inferSelect;

// Enum-like constants
export const USER_ROLES = { ADMIN: "ADMIN", OPERATOR: "OPERATOR" } as const;
export const TRANSACTION_TYPES = { INCOME: "INCOME", EXPENSE: "EXPENSE" } as const;
export const INVOICE_PERIODS = { A_01_15: "A_01_15", B_16_END: "B_16_END" } as const;
export const INVOICE_STATUS = { ISSUED: "ISSUED", SENT: "SENT", PAID: "PAID" } as const;
export const EMPLOYEE_STATUS = { ACTIVE: "ACTIVE", INACTIVE: "INACTIVE" } as const;
export const VEHICLE_STATUS = { ACTIVE: "ACTIVE", INACTIVE: "INACTIVE", MAINTENANCE: "MAINTENANCE" } as const;
export const VEHICLE_TYPES = { TRUCK_3X4: "TRUCK_3X4", FIORINO: "FIORINO", OTHER: "OTHER" } as const;
export const LOADING_TYPES = { URBAN: "URBAN", TRIP: "TRIP" } as const;
