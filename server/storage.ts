import { db } from "./db";
import {
  users, tenants, categories, financeTransactions, invoices, employees, employeePayments, vehicles, loadings, attachments,
  type User, type InsertUser, type Tenant, type Category, type FinanceTransaction, type Invoice, type Employee, type EmployeePayment, type Vehicle, type Loading, type Attachment
} from "@shared/schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User & Tenant
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByCpf(cpf: string): Promise<User | undefined>;
  getUserByCnpj(cnpj: string): Promise<User | undefined>;
  getUser(id: number): Promise<User | undefined>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  getTenant(id: number): Promise<Tenant | undefined>;
  updateTenant(id: number, data: Partial<Tenant>): Promise<Tenant | undefined>;
  createTenant(name: string): Promise<Tenant>; // Minimal for seed
  createUser(user: InsertUser): Promise<User>;

  // Categories
  getCategories(tenantId: number): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: any): Promise<Category>; // Partial type usage for now

  // Finance
  getTransactions(tenantId: number, options?: { month?: string; startDate?: string; endDate?: string }): Promise<(FinanceTransaction & { category: Category })[]>;
  createTransaction(data: any): Promise<FinanceTransaction>;
  
  // Invoices
  getInvoices(
    tenantId: number,
    filters?: { competenceMonth?: string; periodType?: string },
  ): Promise<(Invoice & { attachment: Attachment })[]>;
  createInvoice(data: any): Promise<Invoice>;
  createInvoiceWithFinance(data: any): Promise<Invoice>;

  // Employees
  getEmployees(tenantId: number): Promise<Employee[]>;
  getEmployeeById(id: number): Promise<Employee | undefined>;
  getEmployeeByCpf(cpf: string): Promise<Employee | undefined>;
  createEmployee(data: any): Promise<Employee>;
  createEmployeeWithOperator(data: { employee: any; user: InsertUser }): Promise<Employee>;
  deleteEmployee(tenantId: number, employeeId: number): Promise<"deleted" | "has_payments" | "not_found">;
  getEmployeePaymentByCompetence(tenantId: number, employeeId: number, competenceMonth: string): Promise<EmployeePayment | undefined>;
  getEmployeePayments(tenantId: number, competenceMonth: string): Promise<EmployeePayment[]>;
  createEmployeePayment(data: any): Promise<EmployeePayment>;

  // Vehicles
  getVehicles(tenantId: number): Promise<Vehicle[]>;
  getVehicleById(id: number): Promise<Vehicle | undefined>;
  createVehicle(data: any): Promise<Vehicle>;

  // Loadings
  getLoadings(tenantId: number, options?: { month?: string; vehicleId?: number }): Promise<(Loading & { vehicle: Vehicle })[]>;
  getLoadingById(id: number): Promise<Loading | undefined>;
  createLoading(data: any): Promise<Loading>;
  updateLoading(id: number, data: any): Promise<Loading | undefined>;

  // Attachments
  createAttachment(data: any): Promise<Attachment>;
  getAttachment(id: number): Promise<Attachment | undefined>;
  getAttachmentByStoragePath(storagePath: string): Promise<Attachment | undefined>;

  // Dashboard Stats
  getDashboardStats(tenantId: number, month?: string): Promise<any>;
  getRanking(tenantId: number, month?: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // ... User/Tenant
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async getUserByCpf(cpf: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.cpf, cpf));
    return user;
  }
  async getUserByCnpj(cnpj: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.cnpj, cnpj));
    return user;
  }
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }
  async getTenant(id: number): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant;
  }
  async updateTenant(id: number, data: Partial<Tenant>): Promise<Tenant | undefined> {
    const [tenant] = await db.update(tenants).set(data).where(eq(tenants.id, id)).returning();
    return tenant;
  }
  async createTenant(name: string): Promise<Tenant> {
    const [tenant] = await db.insert(tenants).values({ name, urbanPercent: "0.109", tripPercent: "0.085" }).returning();
    return tenant;
  }
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  // Categories
  async getCategories(tenantId: number): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.tenantId, tenantId));
  }
  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }
  async createCategory(category: any): Promise<Category> {
    const [cat] = await db.insert(categories).values(category).returning();
    return cat;
  }

  // Finance
  async getTransactions(tenantId: number, options?: { month?: string; startDate?: string; endDate?: string }): Promise<(FinanceTransaction & { category: Category })[]> {
    let conditions = [eq(financeTransactions.tenantId, tenantId)];
    
    if (options?.month) {
      const start = new Date(`${options.month}-01`);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      conditions.push(gte(financeTransactions.date, start));
      conditions.push(lte(financeTransactions.date, end));
    } else if (options?.startDate && options?.endDate) {
      conditions.push(gte(financeTransactions.date, new Date(options.startDate)));
      conditions.push(lte(financeTransactions.date, new Date(options.endDate)));
    }

    const rows = await db.select()
      .from(financeTransactions)
      .leftJoin(categories, eq(financeTransactions.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(desc(financeTransactions.date));
      
    return rows.map(r => ({ ...r.finance_transactions, category: r.categories! }));
  }

  async createTransaction(data: any): Promise<FinanceTransaction> {
    const [tx] = await db.insert(financeTransactions).values(data).returning();
    return tx;
  }

  // Invoices
  async getInvoices(
    tenantId: number,
    filters?: { competenceMonth?: string; periodType?: string },
  ): Promise<(Invoice & { attachment: Attachment })[]> {
    let conditions = [eq(invoices.tenantId, tenantId)];
    if (filters?.competenceMonth) {
      conditions.push(eq(invoices.competenceMonth, filters.competenceMonth));
    }
    if (filters?.periodType) {
      conditions.push(eq(invoices.periodType, filters.periodType));
    }
    const rows = await db.select()
      .from(invoices)
      .leftJoin(attachments, eq(invoices.attachmentId, attachments.id))
      .where(and(...conditions))
      .orderBy(desc(invoices.issueDate));
      
    return rows.map(r => ({ ...r.invoices, attachment: r.attachments! }));
  }
  async createInvoice(data: any): Promise<Invoice> {
    const [inv] = await db.insert(invoices).values(data).returning();
    return inv;
  }
  async createInvoiceWithFinance(data: any): Promise<Invoice> {
    return db.transaction(async (tx) => {
      const [existingCategory] = await tx.select()
        .from(categories)
        .where(and(
          eq(categories.tenantId, data.tenantId),
          eq(categories.name, "Invoice"),
        ))
        .limit(1);

      const invoiceCategory = existingCategory ?? (
        await tx.insert(categories).values({
          tenantId: data.tenantId,
          name: "Invoice",
          defaultType: "INCOME",
          isSystem: true,
        }).returning()
      )[0];

      const [createdInvoice] = await tx.insert(invoices).values(data).returning();
      const [createdTransaction] = await tx.insert(financeTransactions).values({
        tenantId: data.tenantId,
        type: "INCOME",
        categoryId: invoiceCategory.id,
        date: data.issueDate,
        amount: data.amount,
        description: createdInvoice.number
          ? `Invoice ${createdInvoice.number}`
          : "Invoice",
        invoiceId: createdInvoice.id,
        attachmentId: createdInvoice.attachmentId,
      }).returning();

      const [linkedInvoice] = await tx.update(invoices)
        .set({ financeTransactionId: createdTransaction.id })
        .where(eq(invoices.id, createdInvoice.id))
        .returning();

      return linkedInvoice;
    });
  }

  // Employees
  async getEmployees(tenantId: number): Promise<Employee[]> {
    return await db.select().from(employees).where(eq(employees.tenantId, tenantId));
  }
  async getEmployeeById(id: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee;
  }
  async getEmployeeByCpf(cpf: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.cpf, cpf));
    return employee;
  }
  async createEmployee(data: any): Promise<Employee> {
    const [emp] = await db.insert(employees).values(data).returning();
    return emp;
  }
  async createEmployeeWithOperator(data: { employee: any; user: InsertUser }): Promise<Employee> {
    return db.transaction(async (tx) => {
      await tx.insert(users).values(data.user);
      const [employee] = await tx.insert(employees).values(data.employee).returning();
      return employee;
    });
  }
  async deleteEmployee(tenantId: number, employeeId: number): Promise<"deleted" | "has_payments" | "not_found"> {
    return db.transaction(async (tx) => {
      const [employee] = await tx.select().from(employees).where(and(
        eq(employees.id, employeeId),
        eq(employees.tenantId, tenantId),
      ));

      if (!employee) {
        return "not_found";
      }

      const [payment] = await tx.select({ id: employeePayments.id }).from(employeePayments).where(and(
        eq(employeePayments.tenantId, tenantId),
        eq(employeePayments.employeeId, employeeId),
      )).limit(1);

      if (payment) {
        return "has_payments";
      }

      await tx.delete(employees).where(and(
        eq(employees.id, employeeId),
        eq(employees.tenantId, tenantId),
      ));

      if (employee.cpf) {
        await tx.delete(users).where(and(
          eq(users.tenantId, tenantId),
          eq(users.cpf, employee.cpf),
          eq(users.role, "OPERATOR"),
        ));
      }

      return "deleted";
    });
  }
  async getEmployeePaymentByCompetence(tenantId: number, employeeId: number, competenceMonth: string): Promise<EmployeePayment | undefined> {
    const [payment] = await db.select().from(employeePayments).where(and(
      eq(employeePayments.tenantId, tenantId),
      eq(employeePayments.employeeId, employeeId),
      eq(employeePayments.competenceMonth, competenceMonth)
    ));
    return payment;
  }
  async getEmployeePayments(tenantId: number, competenceMonth: string): Promise<EmployeePayment[]> {
    return await db.select().from(employeePayments).where(and(
      eq(employeePayments.tenantId, tenantId),
      eq(employeePayments.competenceMonth, competenceMonth)
    ));
  }
  async createEmployeePayment(data: any): Promise<EmployeePayment> {
    const [pymt] = await db.insert(employeePayments).values(data).returning();
    return pymt;
  }

  // Vehicles
  async getVehicles(tenantId: number): Promise<Vehicle[]> {
    return await db.select().from(vehicles).where(eq(vehicles.tenantId, tenantId));
  }
  async getVehicleById(id: number): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle;
  }
  async createVehicle(data: any): Promise<Vehicle> {
    const [veh] = await db.insert(vehicles).values(data).returning();
    return veh;
  }

  // Loadings
  async getLoadings(tenantId: number, options?: { month?: string; vehicleId?: number }): Promise<(Loading & { vehicle: Vehicle })[]> {
    let conditions = [eq(loadings.tenantId, tenantId)];
    if (options?.month) {
      const start = new Date(`${options.month}-01`);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      conditions.push(gte(loadings.date, start));
      conditions.push(lte(loadings.date, end));
    }
    if (options?.vehicleId) {
      conditions.push(eq(loadings.vehicleId, options.vehicleId));
    }
    const rows = await db.select()
      .from(loadings)
      .leftJoin(vehicles, eq(loadings.vehicleId, vehicles.id))
      .where(and(...conditions))
      .orderBy(desc(loadings.date));
    return rows.map(r => ({ ...r.loadings, vehicle: r.vehicles! }));
  }
  async getLoadingById(id: number): Promise<Loading | undefined> {
    const [loading] = await db.select().from(loadings).where(eq(loadings.id, id));
    return loading;
  }
  async createLoading(data: any): Promise<Loading> {
    const [load] = await db.insert(loadings).values(data).returning();
    return load;
  }
  async updateLoading(id: number, data: any): Promise<Loading | undefined> {
    const [load] = await db.update(loadings).set(data).where(eq(loadings.id, id)).returning();
    return load;
  }

  // Attachments
  async createAttachment(data: any): Promise<Attachment> {
    const [att] = await db.insert(attachments).values(data).returning();
    return att;
  }
  async getAttachment(id: number): Promise<Attachment | undefined> {
    const [att] = await db.select().from(attachments).where(eq(attachments.id, id));
    return att;
  }
  async getAttachmentByStoragePath(storagePath: string): Promise<Attachment | undefined> {
    const [att] = await db.select().from(attachments).where(eq(attachments.storagePath, storagePath));
    return att;
  }

  // Stats
  async getDashboardStats(tenantId: number, month?: string): Promise<any> {
    // Simplified stats for now
    let dateFilter = sql`1=1`;
    if (month) {
      const start = `${month}-01`;
      const end = new Date(new Date(start).getFullYear(), new Date(start).getMonth() + 1, 0).toISOString().split('T')[0];
      dateFilter = sql`${financeTransactions.date} >= ${start}::date AND ${financeTransactions.date} <= ${end}::date`;
    }

    const income = await db.select({ value: sql<number>`sum(${financeTransactions.amount})` })
      .from(financeTransactions)
      .where(and(eq(financeTransactions.tenantId, tenantId), eq(financeTransactions.type, 'INCOME'), dateFilter));
      
    const expenses = await db.select({ value: sql<number>`sum(${financeTransactions.amount})` })
      .from(financeTransactions)
      .where(and(eq(financeTransactions.tenantId, tenantId), eq(financeTransactions.type, 'EXPENSE'), dateFilter));

    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const invoiceCount = await db.select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(and(
        eq(invoices.tenantId, tenantId),
        eq(invoices.competenceMonth, targetMonth),
      ));

    const invoiceTotal = await db.select({ value: sql<number>`sum(${invoices.amount})` })
      .from(invoices)
      .where(and(
        eq(invoices.tenantId, tenantId),
        eq(invoices.competenceMonth, targetMonth),
      ));

    return {
      income: Number(income[0]?.value || 0),
      expenses: Number(expenses[0]?.value || 0),
      balance: Number(income[0]?.value || 0) - Number(expenses[0]?.value || 0),
      missingInvoice: Number(invoiceCount[0]?.count || 0) === 0,
      currentInvoiceTotal: Number(invoiceTotal[0]?.value || 0),
    };
  }
  
  async getRanking(tenantId: number, month?: string): Promise<any> {
    // Ranking by estimated Revenue
    let dateFilter = sql`1=1`;
    if (month) {
      const start = `${month}-01`;
      const end = new Date(new Date(start).getFullYear(), new Date(start).getMonth() + 1, 0).toISOString().split('T')[0];
      dateFilter = sql`${loadings.date} >= ${start}::date AND ${loadings.date} <= ${end}::date`;
    }

    const rows = await db.select({
      vehicleId: vehicles.id,
      nickname: vehicles.nickname,
      plate: vehicles.plate,
      estimatedRevenue: sql<number>`sum(${loadings.estimatedRevenue})`
    })
    .from(loadings)
    .innerJoin(vehicles, eq(loadings.vehicleId, vehicles.id))
    .where(and(eq(loadings.tenantId, tenantId), dateFilter))
    .groupBy(vehicles.id, vehicles.nickname, vehicles.plate)
    .orderBy(desc(sql`sum(${loadings.estimatedRevenue})`));

    return rows.map(r => ({
      ...r,
      estimatedRevenue: Number(r.estimatedRevenue)
    }));
  }
}

export const storage = new DatabaseStorage();
