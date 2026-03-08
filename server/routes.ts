import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import session from "express-session";
import MongoStore from "connect-pg-simple";
import { pool } from "./db";
import multer from "multer";
import path from "path";
import fs from "fs";
import { asyncHandler, HttpError } from "./http";
import { USER_ROLES } from "@shared/schema";
import { normalizeCpf } from "@shared/cpf";
import { normalizeCnpj } from "@shared/cnpj";
import { extractInvoiceDraftFromFile } from "./invoice-extraction";

const pgSession = MongoStore(session);

function sanitizeUser<T extends { password?: string }>(user: T) {
  const { password, ...safeUser } = user;
  return safeUser;
}

function getCurrentUser(req: Request) {
  return req.user as {
    id: number;
    tenantId: number;
    role: keyof typeof USER_ROLES;
    name: string;
    email: string | null;
    cpf: string | null;
    cnpj: string | null;
  };
}

function requireRoles(...roles: Array<keyof typeof USER_ROLES>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = getCurrentUser(req);
    if (!roles.includes(user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
}

function maskLoadingForOperator<T extends Record<string, any>>(loading: T) {
  return {
    ...loading,
    appliedPercent: "0",
    estimatedRevenue: "0",
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const isProduction = process.env.NODE_ENV === "production";
  
  // === AUTH SETUP ===
  const sessionSecret =
    process.env.SESSION_SECRET || (isProduction ? undefined : "dev_secret_123");
  if (!sessionSecret) {
    throw new Error("SESSION_SECRET must be set in production");
  }

  if (isProduction) {
    app.set("trust proxy", 1);
  }

  app.use(session({
    store: new pgSession({ pool, createTableIfMissing: true }),
    name: "nextgate.sid",
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    proxy: isProduction,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction ? "auto" : false,
    },
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy({ usernameField: "identifier" }, async (identifier, password, done) => {
    try {
      if (typeof identifier !== "string" || typeof password !== "string") {
        return done(null, false);
      }

      const sanitizedIdentifier = identifier.trim();
      if (!sanitizedIdentifier) {
        return done(null, false);
      }

      const normalizedDigits = sanitizedIdentifier.replace(/\D/g, "");
      const user = sanitizedIdentifier.includes("@")
        ? await storage.getUserByEmail(sanitizedIdentifier.toLowerCase())
        : normalizedDigits.length === 14
          ? await storage.getUserByCnpj(normalizeCnpj(sanitizedIdentifier))
          : await storage.getUserByCpf(normalizeCpf(sanitizedIdentifier));
      if (!user) return done(null, false);
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) return done(null, false);
      return done(null, sanitizeUser(user));
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user ? sanitizeUser(user) : undefined);
    } catch (err) {
      done(err);
    }
  });

  // Middleware to ensure login
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ message: "Unauthorized" });
  };

  // === FILE UPLOAD SETUP ===
  const uploadDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
  
  const upload = multer({
    storage: multer.diskStorage({
      destination: uploadDir,
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
      }
    }),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    fileFilter: (req, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (allowed.includes(file.mimetype)) cb(null, true);
      else cb(new Error('Invalid file type'));
    }
  });

  // Serve uploads with tenant ownership checks
  app.get("/uploads/:filename", requireRoles("ADMIN"), asyncHandler(async (req, res) => {
    const rawFilename = req.params.filename;
    if (typeof rawFilename !== "string") {
      throw new HttpError(400, "Invalid file path");
    }

    const filename = path.basename(rawFilename);
    if (filename !== rawFilename) {
      throw new HttpError(400, "Invalid file path");
    }

    const tenantId = getCurrentUser(req).tenantId;
    const storagePath = `/uploads/${filename}`;
    const attachment = await storage.getAttachmentByStoragePath(storagePath);
    if (!attachment || attachment.tenantId !== tenantId) {
      throw new HttpError(404, "File not found");
    }

    const fullPath = path.join(uploadDir, filename);
    if (!fs.existsSync(fullPath)) {
      throw new HttpError(404, "File not found");
    }

    res.sendFile(fullPath);
  }));

  // === ROUTES ===
  app.get("/healthz", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // Auth
  app.post(
    api.auth.login.path,
    (req, _res, next) => {
      if (!req.body?.identifier && typeof req.body?.username === "string") {
        req.body.identifier = req.body.username;
      }
      next();
    },
    passport.authenticate('local'),
    (req, res) => {
      res.json(req.user);
    },
  );

  app.post(api.auth.logout.path, (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    res.json(req.user);
  });

  // Uploads
  app.post(api.uploads.upload.path, requireRoles("ADMIN"), upload.single('file'), asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new HttpError(400, "No file uploaded");
    }

    const attachment = await storage.createAttachment({
      tenantId: getCurrentUser(req).tenantId,
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      storagePath: '/uploads/' + req.file.filename,
    });
    res.status(201).json(attachment);
  }));
  app.post(api.invoices.extract.path, requireRoles("ADMIN"), upload.single('file'), asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new HttpError(400, "No file uploaded");
    }

    const tenantId = getCurrentUser(req).tenantId;
    const attachment = await storage.createAttachment({
      tenantId,
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      storagePath: '/uploads/' + req.file.filename,
    });

    const { draft, warnings } = await extractInvoiceDraftFromFile({
      path: req.file.path,
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
    });

    res.json({
      attachment,
      draft,
      warnings,
    });
  }));

  // Dashboard
  app.get(api.dashboard.stats.path, requireRoles("ADMIN"), asyncHandler(async (req, res) => {
    const stats = await storage.getDashboardStats(getCurrentUser(req).tenantId, req.query.month as string);
    res.json(stats);
  }));
  
  app.get(api.dashboard.ranking.path, requireRoles("ADMIN"), asyncHandler(async (req, res) => {
    const ranking = await storage.getRanking(getCurrentUser(req).tenantId, req.query.month as string);
    res.json(ranking);
  }));

  // Finance
  app.get(api.finance.list.path, requireRoles("ADMIN"), asyncHandler(async (req, res) => {
    const txs = await storage.getTransactions(getCurrentUser(req).tenantId, req.query as any);
    res.json(txs);
  }));
  app.post(api.finance.create.path, requireRoles("ADMIN"), asyncHandler(async (req, res) => {
    const tenantId = getCurrentUser(req).tenantId;
    const data = api.finance.create.input.parse(req.body);

    const category = await storage.getCategory(data.categoryId);
    if (!category || category.tenantId !== tenantId) {
      throw new HttpError(400, "Invalid category for tenant");
    }

    if (data.attachmentId) {
      const attachment = await storage.getAttachment(data.attachmentId);
      if (!attachment || attachment.tenantId !== tenantId) {
        throw new HttpError(400, "Invalid attachment for tenant");
      }
    }

    const tx = await storage.createTransaction({ ...data, tenantId });
    res.status(201).json(tx);
  }));

  // Invoices
  app.get(api.invoices.list.path, requireRoles("ADMIN"), asyncHandler(async (req, res) => {
    const filters = api.invoices.list.input?.parse(req.query) ?? {};
    const invs = await storage.getInvoices(getCurrentUser(req).tenantId, filters);
    res.json(invs);
  }));
  app.post(api.invoices.create.path, requireRoles("ADMIN"), asyncHandler(async (req, res) => {
    const tenantId = getCurrentUser(req).tenantId;
    const data = api.invoices.create.input.parse(req.body);

    const attachment = await storage.getAttachment(data.attachmentId);
    if (!attachment || attachment.tenantId !== tenantId) {
      throw new HttpError(400, "Invalid attachment for tenant");
    }

    const inv = await storage.createInvoice({ ...data, tenantId });
    let invoiceCategory = (await storage.getCategories(tenantId)).find(c => c.name === "Invoice");
    if (!invoiceCategory) {
      invoiceCategory = await storage.createCategory({
        tenantId,
        name: "Invoice",
        defaultType: "INCOME",
        isSystem: true,
      });
    }

    await storage.createTransaction({
      tenantId,
      type: "INCOME",
      categoryId: invoiceCategory.id,
      date: new Date(inv.issueDate),
      amount: inv.amount,
      description: `Invoice ${inv.number || ""}`,
      invoiceId: inv.id,
      attachmentId: inv.attachmentId,
    });
    res.status(201).json(inv);
  }));

  // Employees
  app.get(api.employees.list.path, requireRoles("ADMIN"), asyncHandler(async (req, res) => {
    const emps = await storage.getEmployees(getCurrentUser(req).tenantId);
    res.json(emps);
  }));
  app.post(api.employees.create.path, requireRoles("ADMIN"), asyncHandler(async (req, res) => {
    const tenantId = getCurrentUser(req).tenantId;
    const data = api.employees.create.input.parse(req.body);
    const employeeCpf = data.cpf;

    const existingEmployee = await storage.getEmployeeByCpf(employeeCpf);
    if (existingEmployee) {
      throw new HttpError(409, "CPF já cadastrado para um funcionário");
    }

    const existingUser = await storage.getUserByCpf(employeeCpf);
    if (existingUser) {
      throw new HttpError(409, "CPF já cadastrado para um usuário");
    }

    const hashedPassword = await bcrypt.hash(employeeCpf.slice(-4), 10);
    let emp;
    try {
      emp = await storage.createEmployeeWithOperator({
        employee: { ...data, tenantId },
        user: {
          tenantId,
          name: data.name,
          email: null,
          cpf: employeeCpf,
          password: hashedPassword,
          role: USER_ROLES.OPERATOR,
        },
      });
    } catch (error: any) {
      if (error?.code === "23505") {
        throw new HttpError(409, "CPF já cadastrado");
      }
      throw error;
    }
    res.status(201).json(emp);
  }));
  app.get(api.employees.getPayments.path, requireRoles("ADMIN"), asyncHandler(async (req, res) => {
    const pymts = await storage.getEmployeePayments(getCurrentUser(req).tenantId, req.query.competenceMonth as string);
    res.json(pymts);
  }));
  app.post(api.employees.pay.path, requireRoles("ADMIN"), asyncHandler(async (req, res) => {
    const tenantId = getCurrentUser(req).tenantId;
    const data = api.employees.pay.input.parse(req.body);

    const employee = await storage.getEmployeeById(data.employeeId);
    if (!employee || employee.tenantId !== tenantId) {
      throw new HttpError(400, "Invalid employee for tenant");
    }

    const existingPayment = await storage.getEmployeePaymentByCompetence(
      tenantId,
      data.employeeId,
      data.competenceMonth,
    );
    if (existingPayment) {
      throw new HttpError(409, "Employee already paid for this competence month");
    }

    try {
      const pymt = await storage.createEmployeePayment({ ...data, tenantId });
      let salaryCategory = (await storage.getCategories(tenantId)).find(c => c.name === "Salary");
      if (!salaryCategory) {
        salaryCategory = await storage.createCategory({
          tenantId,
          name: "Salary",
          defaultType: "EXPENSE",
          isSystem: true,
        });
      }

      await storage.createTransaction({
        tenantId,
        type: "EXPENSE",
        categoryId: salaryCategory.id,
        date: new Date(pymt.paymentDate),
        amount: pymt.amount,
        description: `Salary Payment - ${pymt.competenceMonth}`,
        employeePaymentId: pymt.id,
      });
      res.status(201).json(pymt);
    } catch (error: any) {
      if (error?.code === "23505") {
        throw new HttpError(409, "Employee already paid for this competence month");
      }
      throw error;
    }
  }));

  // Vehicles
  app.get(api.vehicles.list.path, requireRoles("ADMIN", "OPERATOR"), asyncHandler(async (req, res) => {
    const vehs = await storage.getVehicles(getCurrentUser(req).tenantId);
    res.json(vehs);
  }));
  app.post(api.vehicles.create.path, requireRoles("ADMIN"), asyncHandler(async (req, res) => {
    const data = api.vehicles.create.input.parse(req.body);
    const veh = await storage.createVehicle({ ...data, tenantId: getCurrentUser(req).tenantId });
    res.status(201).json(veh);
  }));

  // Loadings
  app.get(api.loadings.list.path, requireRoles("ADMIN", "OPERATOR"), asyncHandler(async (req, res) => {
    const user = getCurrentUser(req);
    const loads = await storage.getLoadings(user.tenantId, req.query as any);
    res.json(user.role === "OPERATOR" ? loads.map(maskLoadingForOperator) : loads);
  }));
  app.post(api.loadings.create.path, requireRoles("ADMIN", "OPERATOR"), asyncHandler(async (req, res) => {
    const user = getCurrentUser(req);
    const tenantId = user.tenantId;
    const data = api.loadings.create.input.parse(req.body);

    const vehicle = await storage.getVehicleById(data.vehicleId);
    if (!vehicle || vehicle.tenantId !== tenantId) {
      throw new HttpError(400, "Invalid vehicle for tenant");
    }

    // Calculate estimated revenue
    const tenant = await storage.getTenant(tenantId);
    let appliedPercent = "0";
    if (tenant) {
      appliedPercent = data.type === 'URBAN' ? tenant.urbanPercent : tenant.tripPercent;
    }
    const estimatedRevenue = (Number(data.grossFreight) * Number(appliedPercent)).toString();
    
    const load = await storage.createLoading({ 
      ...data, 
      tenantId,
      appliedPercent,
      estimatedRevenue
    });
    res.status(201).json(user.role === "OPERATOR" ? maskLoadingForOperator(load) : load);
  }));
  app.patch(api.loadings.update.path, requireRoles("ADMIN", "OPERATOR"), asyncHandler(async (req, res) => {
    const user = getCurrentUser(req);
    const tenantId = user.tenantId;
    const loadingId = Number(req.params.id);
    if (!Number.isInteger(loadingId) || loadingId <= 0) {
      throw new HttpError(400, "Invalid loading id");
    }

    const existingLoading = await storage.getLoadingById(loadingId);
    if (!existingLoading || existingLoading.tenantId !== tenantId) {
      throw new HttpError(404, "Loading not found");
    }

    const data = api.loadings.update.input.parse(req.body);
    const vehicle = await storage.getVehicleById(data.vehicleId);
    if (!vehicle || vehicle.tenantId !== tenantId) {
      throw new HttpError(400, "Invalid vehicle for tenant");
    }

    const tenant = await storage.getTenant(tenantId);
    let appliedPercent = "0";
    if (tenant) {
      appliedPercent = data.type === "URBAN" ? tenant.urbanPercent : tenant.tripPercent;
    }

    const estimatedRevenue = (Number(data.grossFreight) * Number(appliedPercent)).toString();
    const updatedLoading = await storage.updateLoading(loadingId, {
      ...data,
      appliedPercent,
      estimatedRevenue,
      updatedAt: new Date(),
    });

    if (!updatedLoading) {
      throw new HttpError(404, "Loading not found");
    }

    res.json(user.role === "OPERATOR" ? maskLoadingForOperator(updatedLoading) : updatedLoading);
  }));

  // Categories
  app.get(api.categories.list.path, requireRoles("ADMIN"), asyncHandler(async (req, res) => {
    const cats = await storage.getCategories(getCurrentUser(req).tenantId);
    res.json(cats);
  }));

  // SEED DATA (idempotent)
  const shouldSeed = process.env.SEED_DATA !== "false";
  if (shouldSeed) {
    const seedAdminEmail = process.env.SEED_ADMIN_EMAIL || "admin@nextgatelog.local";
    const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD;

    try {
      const normalizedSeedAdminEmail = seedAdminEmail.toLowerCase();
      const existingAdmin = await storage.getUserByEmail(normalizedSeedAdminEmail);
      if (existingAdmin) {
        console.log(`Seed skipped, user already exists: ${normalizedSeedAdminEmail}`);
      } else if (isProduction && !seedAdminPassword) {
        console.log("Seed skipped in production: set SEED_ADMIN_PASSWORD to enable first admin creation");
      } else {
        const tenant = await storage.createTenant("A F SILVA TRANSPORTES");
        const hashedPassword = await bcrypt.hash(seedAdminPassword || "admin123", 10);
        await storage.createUser({
          tenantId: tenant.id,
          name: "Admin User",
          email: normalizedSeedAdminEmail,
          cpf: null,
          password: hashedPassword,
          role: "ADMIN"
        });
        
        const categories = [
          { name: "Invoice", defaultType: "INCOME", isSystem: true },
          { name: "Salary", defaultType: "EXPENSE", isSystem: true },
          { name: "Fuel", defaultType: "EXPENSE", isSystem: false },
          { name: "Maintenance", defaultType: "EXPENSE", isSystem: false },
          { name: "Taxes", defaultType: "EXPENSE", isSystem: false },
          { name: "Other", defaultType: "BOTH", isSystem: false },
        ];
        for (const cat of categories) {
          await storage.createCategory({ ...cat, tenantId: tenant.id });
        }
        console.log(`Seed data initialized for ${normalizedSeedAdminEmail}`);
      }
    } catch (e) {
      console.log("Seed data skipped or error:", e);
    }
  }

  return httpServer;
}
