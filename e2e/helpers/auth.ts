import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { api } from "../../shared/routes";

export async function loginByApi(
  request: APIRequestContext,
  credentials: { identifier: string; password: string },
) {
  const response = await request.post(api.auth.login.path, {
    data: credentials,
  });

  expect(response.ok(), "API login should succeed").toBeTruthy();
  return api.auth.login.responses[200].parse(await response.json());
}

export async function logoutByApi(request: APIRequestContext) {
  await request.post(api.auth.logout.path);
}

export async function loginByUi(
  page: Page,
  credentials: { identifier: string; password: string },
) {
  await page.goto("/auth");
  await page.getByLabel(/CPF ou CNPJ/i).fill(credentials.identifier);
  await page.getByLabel(/Senha/i).fill(credentials.password);
  await page.getByRole("button", { name: /Entrar no Sistema/i }).click();
}
