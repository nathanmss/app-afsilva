import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import session from "express-session";
import MongoStore from "connect-pg-simple";
import { pool } from "./db";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";

const pgSession = MongoStore(session);

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // === AUTH SETUP ===
  app.use(session({
    store: new pgSession({ pool, createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET || "dev_secret_123",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByEmail(username);
      if (!user) return done(null, false);
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) return done(null, false);
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
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

  // Serve uploads
  app.use('/uploads', express.static(uploadDir));

  // === ROUTES ===

  // Auth
  app.post(api.auth.login.path, passport.authenticate('local'), (req, res) => {
    res.json(req.user);
  });

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
  app.post(api.uploads.upload.path, requireAuth, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const attachment = await storage.createAttachment({
      tenantId: (req.user as any).tenantId,
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      storagePath: '/uploads/' + req.file.filename,
    });
    res.status(201).json(attachment);
  });

  // Dashboard
  app.get(api.dashboard.stats.path, requireAuth, async (req, res) => {
    const stats = await storage.getDashboardStats((req.user as any).tenantId, req.query.month as string);
    res.json(stats);
  });
  
  app.get(api.dashboard.ranking.path, requireAuth, async (req, res) => {
    const ranking = await storage.getRanking((req.user as any).tenantId, req.query.month as string);
    res.json(ranking);
  });

  // Finance
  app.get(api.finance.list.path, requireAuth, async (req, res) => {
    const txs = await storage.getTransactions((req.user as any).tenantId, req.query as any);
    res.json(txs);
  });
  app.post(api.finance.create.path, requireAuth, async (req, res) => {
    const data = api.finance.create.input.parse(req.body);
    const tx = await storage.createTransaction({ ...data, tenantId: (req.user as any).tenantId });
    res.status(201).json(tx);
  });

  // Invoices
  app.get(api.invoices.list.path, requireAuth, async (req, res) => {
    const invs = await storage.getInvoices((req.user as any).tenantId, req.query.competenceMonth as string);
    res.json(invs);
  });
  app.post(api.invoices.create.path, requireAuth, async (req, res) => {
    const data = api.invoices.create.input.parse(req.body);
    const inv = await storage.createInvoice({ ...data, tenantId: (req.user as any).tenantId });
    // Auto-create income transaction
    const category = (await storage.getCategories((req.user as any).tenantId)).find(c => c.name === 'Invoice');
    if (category) {
      await storage.createTransaction({
        tenantId: (req.user as any).tenantId,
        type: 'INCOME',
        categoryId: category.id,
        date: new Date(inv.issueDate),
        amount: inv.amount,
        description: `Invoice ${inv.number || ''}`,
        invoiceId: inv.id,
        attachmentId: inv.attachmentId,
      });
    }
    res.status(201).json(inv);
  });

  // Employees
  app.get(api.employees.list.path, requireAuth, async (req, res) => {
    const emps = await storage.getEmployees((req.user as any).tenantId);
    res.json(emps);
  });
  app.post(api.employees.create.path, requireAuth, async (req, res) => {
    const data = api.employees.create.input.parse(req.body);
    const emp = await storage.createEmployee({ ...data, tenantId: (req.user as any).tenantId });
    res.status(201).json(emp);
  });
  app.get(api.employees.getPayments.path, requireAuth, async (req, res) => {
    const pymts = await storage.getEmployeePayments((req.user as any).tenantId, req.query.competenceMonth as string);
    res.json(pymts);
  });
  app.post(api.employees.pay.path, requireAuth, async (req, res) => {
    const data = api.employees.pay.input.parse(req.body);
    const pymt = await storage.createEmployeePayment({ ...data, tenantId: (req.user as any).tenantId });
    
    // Auto-create expense transaction
    const category = (await storage.getCategories((req.user as any).tenantId)).find(c => c.name === 'Salary');
    if (category) {
      await storage.createTransaction({
        tenantId: (req.user as any).tenantId,
        type: 'EXPENSE',
        categoryId: category.id,
        date: new Date(pymt.paymentDate),
        amount: pymt.amount,
        description: `Salary Payment - ${pymt.competenceMonth}`,
        employeePaymentId: pymt.id,
      });
    }
    res.status(201).json(pymt);
  });

  // Vehicles
  app.get(api.vehicles.list.path, requireAuth, async (req, res) => {
    const vehs = await storage.getVehicles((req.user as any).tenantId);
    res.json(vehs);
  });
  app.post(api.vehicles.create.path, requireAuth, async (req, res) => {
    const data = api.vehicles.create.input.parse(req.body);
    const veh = await storage.createVehicle({ ...data, tenantId: (req.user as any).tenantId });
    res.status(201).json(veh);
  });

  // Loadings
  app.get(api.loadings.list.path, requireAuth, async (req, res) => {
    const loads = await storage.getLoadings((req.user as any).tenantId, req.query as any);
    res.json(loads);
  });
  app.post(api.loadings.create.path, requireAuth, async (req, res) => {
    const data = api.loadings.create.input.parse(req.body);
    // Calculate estimated revenue
    const tenant = await storage.getTenant((req.user as any).tenantId);
    let appliedPercent = "0";
    if (tenant) {
      appliedPercent = data.type === 'URBAN' ? tenant.urbanPercent : tenant.tripPercent;
    }
    const estimatedRevenue = (Number(data.grossFreight) * Number(appliedPercent)).toString();
    
    const load = await storage.createLoading({ 
      ...data, 
      tenantId: (req.user as any).tenantId,
      appliedPercent,
      estimatedRevenue
    });
    res.status(201).json(load);
  });

  // Categories
  app.get(api.categories.list.path, requireAuth, async (req, res) => {
    const cats = await storage.getCategories((req.user as any).tenantId);
    res.json(cats);
  });

  // SEED DATA
  try {
    const tenant = await storage.createTenant("A F SILVA TRANSPORTES");
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await storage.createUser({
      tenantId: tenant.id,
      name: "Admin User",
      email: "admin@nextgatelog.local",
      password: hashedPassword,
      role: "ADMIN"
    });
    
    // Categories
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
    console.log("Seed data initialized");
  } catch (e) {
    // Ignore duplicates or errors if already seeded
    console.log("Seed data skipped or error:", e);
  }

  return httpServer;
}
