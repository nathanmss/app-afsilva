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
  manageLoadingSchema,
  insertLoadingSchema,
  users, categories, financeTransactions, invoices, employees, employeePayments, vehicles, loadings, attachments,
  type AuthUser,
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
  forbidden: z.object({
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
        identifier: z.string().trim().min(1, 'Informe CPF ou e-mail'),
        password: z.string().min(1, 'Informe a senha'),
      }),
      responses: {
        200: z.custom<AuthUser>(),
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
        200: z.custom<AuthUser>(),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
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
        403: errorSchemas.forbidden,
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
        403: errorSchemas.forbidden,
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
        403: errorSchemas.forbidden,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/finance',
      input: insertFinanceTransactionSchema,
      responses: {
        201: z.custom<typeof financeTransactions.$inferSelect>(),
        403: errorSchemas.forbidden,
      },
    },
  },
  invoices: {
    list: {
      method: 'GET' as const,
      path: '/api/invoices',
      input: z.object({
        competenceMonth: z.string().optional(),
        periodType: z.enum(['A_01_15', 'B_16_END']).optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof invoices.$inferSelect & { attachment: typeof attachments.$inferSelect }>()),
        403: errorSchemas.forbidden,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/invoices',
      input: insertInvoiceSchema,
      responses: {
        201: z.custom<typeof invoices.$inferSelect>(),
        403: errorSchemas.forbidden,
      },
    },
    extract: {
      method: 'POST' as const,
      path: '/api/invoices/extract',
      responses: {
        200: z.object({
          attachment: z.custom<typeof attachments.$inferSelect>(),
          draft: z.object({
            number: z.string().nullable(),
            issueDate: z.string().nullable(),
            competenceMonth: z.string().nullable(),
            periodType: z.enum(['A_01_15', 'B_16_END']),
            amount: z.string().nullable(),
            status: z.enum(['ISSUED', 'SENT', 'PAID']),
          }),
          warnings: z.array(z.string()),
        }),
        403: errorSchemas.forbidden,
      },
    },
  },
  employees: {
    list: {
      method: 'GET' as const,
      path: '/api/employees',
      responses: {
        200: z.array(z.custom<typeof employees.$inferSelect>()),
        403: errorSchemas.forbidden,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/employees',
      input: insertEmployeeSchema,
      responses: {
        201: z.custom<typeof employees.$inferSelect>(),
        403: errorSchemas.forbidden,
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
        403: errorSchemas.forbidden,
      },
    },
    pay: {
      method: 'POST' as const,
      path: '/api/employee-payments',
      input: insertEmployeePaymentSchema,
      responses: {
        201: z.custom<typeof employeePayments.$inferSelect>(),
        403: errorSchemas.forbidden,
      },
    },
  },
  vehicles: {
    list: {
      method: 'GET' as const,
      path: '/api/vehicles',
      responses: {
        200: z.array(z.custom<typeof vehicles.$inferSelect>()),
        403: errorSchemas.forbidden,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/vehicles',
      input: insertVehicleSchema,
      responses: {
        201: z.custom<typeof vehicles.$inferSelect>(),
        403: errorSchemas.forbidden,
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
        403: errorSchemas.forbidden,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/loadings',
      input: manageLoadingSchema,
      responses: {
        201: z.custom<typeof loadings.$inferSelect>(),
        403: errorSchemas.forbidden,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/loadings/:id',
      input: manageLoadingSchema,
      responses: {
        200: z.custom<typeof loadings.$inferSelect>(),
        403: errorSchemas.forbidden,
      },
    },
  },
  categories: {
    list: {
      method: 'GET' as const,
      path: '/api/categories',
      responses: {
        200: z.array(z.custom<typeof categories.$inferSelect>()),
        403: errorSchemas.forbidden,
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
        403: errorSchemas.forbidden,
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
