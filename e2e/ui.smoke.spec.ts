import { expect, request, test, type APIRequestContext, type Dialog } from "@playwright/test";
import { api } from "../shared/routes";
import { e2eEnv } from "./helpers/env";
import { loginByApi, loginByUi } from "./helpers/auth";
import {
  buildTemporaryEmployeePayload,
  createTemporaryEmployee,
  deleteEmployeeIfPossible,
} from "./helpers/data";

test.describe.serial("UI smoke", () => {
  let adminRequest: APIRequestContext;

  test.beforeAll(async () => {
    adminRequest = await request.newContext({
      baseURL: e2eEnv.baseURL,
    });

    await loginByApi(adminRequest, {
      identifier: e2eEnv.adminLogin(),
      password: e2eEnv.adminPassword(),
    });
  });

  test.afterAll(async () => {
    await adminRequest.dispose();
  });

  test("admin can log in and navigate through dashboard, profile and company pages", async ({ page }) => {
    await loginByUi(page, {
      identifier: e2eEnv.adminLogin(),
      password: e2eEnv.adminPassword(),
    });

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: /Painel Operacional/i })).toBeVisible();
    await expect(page.getByText("Meu Perfil")).toBeVisible();

    await page.getByText("Meu Perfil").click();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByRole("heading", { name: /Meu Perfil/i })).toBeVisible();
    await page.getByRole("button", { name: /Salvar Perfil/i }).click();
    await expect(page.getByText(/Perfil atualizado/i)).toBeVisible();

    await page.getByText("Empresa").click();
    await expect(page).toHaveURL(/\/company-profile$/);
    await expect(page.getByRole("heading", { name: /Perfil da Empresa/i })).toBeVisible();
    await page.getByRole("button", { name: /Salvar Configurações/i }).click();
    await expect(page.getByText(/Perfil atualizado|Configurações/i)).toBeVisible();
  });

  test("admin can delete a temporary employee from the UI", async ({ page }) => {
    const temp = buildTemporaryEmployeePayload();
    const createdEmployee = await createTemporaryEmployee(adminRequest, temp.payload);

    try {
      await loginByUi(page, {
        identifier: e2eEnv.adminLogin(),
        password: e2eEnv.adminPassword(),
      });

      await page.getByText("Funcionários").click();
      await expect(page).toHaveURL(/\/employees$/);
      await expect(page.getByRole("heading", { name: /Recursos Humanos/i })).toBeVisible();

      const card = page.locator("div,article,section").filter({ hasText: temp.displayName }).first();
      await expect(card).toBeVisible();

      page.once("dialog", async (dialog: Dialog) => {
        await dialog.accept();
      });

      await card.getByRole("button", { name: /Excluir/i }).click();
      await expect(page.getByText(/Funcionário excluído/i)).toBeVisible();
      await expect(page.getByText(temp.displayName)).toHaveCount(0);
    } finally {
      await deleteEmployeeIfPossible(adminRequest, createdEmployee.id);
    }
  });

  test("operator only sees profile and loadings modules", async ({ page }) => {
    const temp = buildTemporaryEmployeePayload();
    const createdEmployee = await createTemporaryEmployee(adminRequest, temp.payload);

    try {
      await loginByUi(page, {
        identifier: temp.login,
        password: temp.password,
      });

      await expect(page).toHaveURL(/\/loadings$/);
      await expect(page.getByRole("heading", { name: /Operações de Carga/i })).toBeVisible();
      await expect(page.getByText("Meu Perfil")).toBeVisible();
      await expect(page.getByText("Cargas")).toBeVisible();
      await expect(page.getByText("Financeiro")).toHaveCount(0);
      await expect(page.getByText("Empresa")).toHaveCount(0);

      await page.getByText("Meu Perfil").click();
      await expect(page).toHaveURL(/\/profile$/);
      await expect(page.getByRole("heading", { name: /Meu Perfil/i })).toBeVisible();
    } finally {
      await deleteEmployeeIfPossible(adminRequest, createdEmployee.id);
    }
  });
});
