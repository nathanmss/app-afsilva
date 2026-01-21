import { z } from 'zod';
import { 
  insertUserSchema, 
  insertTenantSchema,
  insertCategorySchema,
  insertFinanceTransactionSchema,
  insertInvoiceSchema,
  insertEmployeeSchema,
  insertEmployeePaymentSchema,
  insertVehicleSchema,
  insertLoadingSchema,
  users, categories, financeTransactions, invoices, employees, employeePayments, vehicles, loadings, attachments
} from './schema';

// Shared error schemas
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

// API Contract
export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/login',
      input: z.object({
        username: z.string().email(), // We use email as username
        password: z.string(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout',
      responses: {
        200: z.void(),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  dashboard: {
    stats: {
      method: 'GET' as const,
      path: '/api/dashboard/stats',
      input: z.object({
        month: z.string().optional(), // YYYY-MM
      }).optional(),
      responses: {
        200: z.object({
          income: z.number(),
          expenses: z.number(),
          balance: z.number(),
          missingInvoice: z.boolean(),
          currentInvoiceTotal: z.number(),
        }),
      },
    },
    ranking: {
      method: 'GET' as const,
      path: '/api/dashboard/ranking',
      input: z.object({
        month: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.object({
          vehicleId: z.number(),
          nickname: z.string(),
          plate: z.string(),
          estimatedRevenue: z.number(),
        })),
      },
    },
  },
  finance: {
    list: {
      method: 'GET' as const,
      path: '/api/finance',
      input: z.object({
        month: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof financeTransactions.$inferSelect & { category: typeof categories.$inferSelect }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/finance',
      input: insertFinanceTransactionSchema,
      responses: {
        201: z.custom<typeof financeTransactions.$inferSelect>(),
      },
    },
  },
  invoices: {
    list: {
      method: 'GET' as const,
      path: '/api/invoices',
      input: z.object({
        competenceMonth: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof invoices.$inferSelect & { attachment: typeof attachments.$inferSelect }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/invoices',
      input: insertInvoiceSchema,
      responses: {
        201: z.custom<typeof invoices.$inferSelect>(),
      },
    },
  },
  employees: {
    list: {
      method: 'GET' as const,
      path: '/api/employees',
      responses: {
        200: z.array(z.custom<typeof employees.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/employees',
      input: insertEmployeeSchema,
      responses: {
        201: z.custom<typeof employees.$inferSelect>(),
      },
    },
    getPayments: {
      method: 'GET' as const,
      path: '/api/employee-payments',
      input: z.object({
        competenceMonth: z.string(),
      }),
      responses: {
        200: z.array(z.custom<typeof employeePayments.$inferSelect>()),
      },
    },
    pay: {
      method: 'POST' as const,
      path: '/api/employee-payments',
      input: insertEmployeePaymentSchema,
      responses: {
        201: z.custom<typeof employeePayments.$inferSelect>(),
      },
    },
  },
  vehicles: {
    list: {
      method: 'GET' as const,
      path: '/api/vehicles',
      responses: {
        200: z.array(z.custom<typeof vehicles.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/vehicles',
      input: insertVehicleSchema,
      responses: {
        201: z.custom<typeof vehicles.$inferSelect>(),
      },
    },
  },
  loadings: {
    list: {
      method: 'GET' as const,
      path: '/api/loadings',
      input: z.object({
        month: z.string().optional(),
        vehicleId: z.coerce.number().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof loadings.$inferSelect & { vehicle: typeof vehicles.$inferSelect }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/loadings',
      input: insertLoadingSchema,
      responses: {
        201: z.custom<typeof loadings.$inferSelect>(),
      },
    },
  },
  categories: {
    list: {
      method: 'GET' as const,
      path: '/api/categories',
      responses: {
        200: z.array(z.custom<typeof categories.$inferSelect>()),
      },
    },
  },
  uploads: {
    upload: {
      method: 'POST' as const,
      path: '/api/uploads',
      // input: FormData (not definable in Zod easily for request body parsing here, handled manually)
      responses: {
        201: z.custom<typeof attachments.$inferSelect>(),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
