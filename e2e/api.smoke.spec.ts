import { expect, request, test, type APIRequestContext } from "@playwright/test";
import { Client } from "pg";
import { api } from "../shared/routes";
import { e2eEnv } from "./helpers/env";
import { loginByApi, logoutByApi } from "./helpers/auth";
import {
  buildTemporaryEmployeePayload,
  buildTemporaryInvoicePayload,
  createTemporaryEmployee,
  createTemporaryInvoice,
  deleteEmployeeIfPossible,
  deleteInvoiceIfPossible,
  uploadTemporaryInvoiceAttachment,
} from "./helpers/data";

test.describe.serial("API smoke", () => {
  let adminRequest: APIRequestContext;
  let operatorRequest: APIRequestContext | undefined;
  let currentProfile: any;
  let currentCompanyProfile: any;
  let tempEmployeeId: number | null = null;
  let tempInvoiceId: number | null = null;

  test.beforeAll(async () => {
    adminRequest = await request.newContext({
      baseURL: e2eEnv.baseURL,
      extraHTTPHeaders: {
        Accept: "application/json",
      },
    });

    await loginByApi(adminRequest, {
      identifier: e2eEnv.adminLogin(),
      password: e2eEnv.adminPassword(),
    });

    currentProfile = await adminRequest.get(api.userProfile.get.path).then((response) => response.json());
    currentCompanyProfile = await adminRequest.get(api.companyProfile.get.path).then((response) => response.json());
  });

  test.afterAll(async () => {
    await deleteInvoiceIfPossible(adminRequest, tempInvoiceId);
    await deleteEmployeeIfPossible(adminRequest, tempEmployeeId);
    await logoutByApi(adminRequest);
    await adminRequest.dispose();
    if (operatorRequest) {
      await operatorRequest.dispose();
      operatorRequest = undefined;
    }
  });

  test("health and admin session endpoints respond", async () => {
    const healthResponse = await adminRequest.get("/healthz");
    expect(healthResponse.ok()).toBeTruthy();
    await expect(healthResponse.json()).resolves.toEqual({ status: "ok" });

    const meResponse = await adminRequest.get(api.auth.me.path);
    expect(meResponse.status()).toBe(200);
    const me = api.auth.me.responses[200].parse(await meResponse.json());
    expect(me.role).toBe("ADMIN");

    const unauthorizedResponse = await request
      .newContext({ baseURL: e2eEnv.baseURL })
      .then(async (unauthenticated) => {
        const response = await unauthenticated.get(api.auth.me.path);
        await unauthenticated.dispose();
        return response;
      });
    expect(unauthorizedResponse.status()).toBe(401);
  });

  test("admin read endpoints return valid payloads", async () => {
    const currentMonth = new Date().toISOString().slice(0, 7);

    const checks = [
      adminRequest.get(api.dashboard.stats.path, { params: { month: currentMonth } }),
      adminRequest.get(api.dashboard.ranking.path, { params: { month: currentMonth } }),
      adminRequest.get(api.companyProfile.get.path),
      adminRequest.get(api.userProfile.get.path),
      adminRequest.get(api.finance.list.path, { params: { month: currentMonth } }),
      adminRequest.get(api.invoices.list.path, { params: { competenceMonth: currentMonth } }),
      adminRequest.get(api.employees.list.path),
      adminRequest.get(api.employees.getPayments.path, { params: { competenceMonth: currentMonth } }),
      adminRequest.get(api.vehicles.list.path),
      adminRequest.get(api.loadings.list.path, { params: { month: currentMonth } }),
      adminRequest.get(api.categories.list.path),
    ];

    const responses = await Promise.all(checks);
    responses.forEach((response) => expect(response.ok()).toBeTruthy());

    const dashboardStats = api.dashboard.stats.responses[200].parse(await responses[0].json());
    api.dashboard.ranking.responses[200].parse(await responses[1].json());
    api.companyProfile.get.responses[200].parse(await responses[2].json());
    api.userProfile.get.responses[200].parse(await responses[3].json());
    api.finance.list.responses[200].parse(await responses[4].json());
    const currentMonthInvoices = api.invoices.list.responses[200].parse(await responses[5].json());
    const invoiceSum = currentMonthInvoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0);
    expect(dashboardStats.currentInvoiceTotal).toBeCloseTo(invoiceSum, 2);
    api.employees.list.responses[200].parse(await responses[6].json());
    api.employees.getPayments.responses[200].parse(await responses[7].json());
    api.vehicles.list.responses[200].parse(await responses[8].json());
    api.loadings.list.responses[200].parse(await responses[9].json());
    api.categories.list.responses[200].parse(await responses[10].json());
  });

  test("safe profile writes accept no-op payloads", async () => {
    const profileResponse = await adminRequest.put(api.userProfile.update.path, {
      data: {
        name: currentProfile.name,
        email: currentProfile.email,
      },
    });
    expect(profileResponse.status()).toBe(200);
    api.userProfile.update.responses[200].parse(await profileResponse.json());

    const companyResponse = await adminRequest.put(api.companyProfile.update.path, {
      data: {
        name: currentCompanyProfile.name,
        city: currentCompanyProfile.city,
        state: currentCompanyProfile.state,
        urbanPercent: String(currentCompanyProfile.urbanPercent),
        tripPercent: String(currentCompanyProfile.tripPercent),
      },
    });
    expect(companyResponse.status()).toBe(200);
    api.companyProfile.update.responses[200].parse(await companyResponse.json());
  });

  test("invoice create/delete persists in database", async () => {
    const attachment = await uploadTemporaryInvoiceAttachment(adminRequest);
    const tempInvoice = buildTemporaryInvoicePayload(attachment.id);
    const createdInvoice = await createTemporaryInvoice(adminRequest, tempInvoice.payload);
    tempInvoiceId = createdInvoice.id;

    const dbClient = new Client({ connectionString: e2eEnv.databaseURL() });
    await dbClient.connect();

    try {
      const createdInvoiceRow = await dbClient.query(
        `
          select id, number, attachment_id, finance_transaction_id
          from invoices
          where id = $1
        `,
        [createdInvoice.id],
      );

      expect(createdInvoiceRow.rowCount).toBe(1);
      expect(createdInvoiceRow.rows[0].number).toBe(tempInvoice.number);
      expect(Number(createdInvoiceRow.rows[0].attachment_id)).toBe(attachment.id);

      const financeTransactionId = Number(createdInvoiceRow.rows[0].finance_transaction_id);
      expect(Number.isInteger(financeTransactionId)).toBeTruthy();

      const financeRow = await dbClient.query(
        `
          select id, invoice_id, attachment_id
          from finance_transactions
          where id = $1
        `,
        [financeTransactionId],
      );

      expect(financeRow.rowCount).toBe(1);
      expect(Number(financeRow.rows[0].invoice_id)).toBe(createdInvoice.id);
      expect(Number(financeRow.rows[0].attachment_id)).toBe(attachment.id);

      const attachmentRow = await dbClient.query(
        `
          select id
          from attachments
          where id = $1
        `,
        [attachment.id],
      );

      expect(attachmentRow.rowCount).toBe(1);

      const deleteResponse = await adminRequest.delete(api.invoices.remove.path.replace(":id", String(createdInvoice.id)));
      expect(deleteResponse.status()).toBe(200);
      api.invoices.remove.responses[200].parse(await deleteResponse.json());
      tempInvoiceId = null;

      const deletedInvoiceRow = await dbClient.query(
        `
          select 1
          from invoices
          where id = $1
        `,
        [createdInvoice.id],
      );
      expect(deletedInvoiceRow.rowCount).toBe(0);

      const deletedFinanceRow = await dbClient.query(
        `
          select 1
          from finance_transactions
          where id = $1
        `,
        [financeTransactionId],
      );
      expect(deletedFinanceRow.rowCount).toBe(0);

      const deletedAttachmentRow = await dbClient.query(
        `
          select 1
          from attachments
          where id = $1
        `,
        [attachment.id],
      );
      expect(deletedAttachmentRow.rowCount).toBe(0);
    } finally {
      await dbClient.end();
    }
  });

  test("employee create, operator permission checks and safe delete work", async () => {
    const temp = buildTemporaryEmployeePayload();
    const createdEmployee = await createTemporaryEmployee(adminRequest, temp.payload);
    tempEmployeeId = createdEmployee.id;

    const employeesResponse = await adminRequest.get(api.employees.list.path);
    const employees = api.employees.list.responses[200].parse(await employeesResponse.json());
    expect(employees.some((employee) => employee.id === createdEmployee.id)).toBeTruthy();

    operatorRequest = await request.newContext({
      baseURL: e2eEnv.baseURL,
      extraHTTPHeaders: {
        Accept: "application/json",
      },
    });

    await loginByApi(operatorRequest, {
      identifier: temp.login,
      password: temp.password,
    });

    const operatorMeResponse = await operatorRequest.get(api.auth.me.path);
    const operatorMe = api.auth.me.responses[200].parse(await operatorMeResponse.json());
    expect(operatorMe.role).toBe("OPERATOR");

    const operatorProfileResponse = await operatorRequest.get(api.userProfile.get.path);
    expect(operatorProfileResponse.status()).toBe(200);

    const operatorLoadingsResponse = await operatorRequest.get(api.loadings.list.path);
    expect(operatorLoadingsResponse.status()).toBe(200);

    const forbiddenDashboardResponse = await operatorRequest.get(api.dashboard.stats.path);
    expect(forbiddenDashboardResponse.status()).toBe(403);

    await logoutByApi(operatorRequest);
    await operatorRequest.dispose();
    operatorRequest = undefined;

    const deleteResponse = await adminRequest.delete(api.employees.remove.path.replace(":id", String(createdEmployee.id)));
    expect(deleteResponse.status()).toBe(200);
    api.employees.remove.responses[200].parse(await deleteResponse.json());
    tempEmployeeId = null;
  });
});
