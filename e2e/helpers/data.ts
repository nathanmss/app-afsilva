import { expect, type APIRequestContext } from "@playwright/test";
import { api } from "../../shared/routes";

function randomDigits(length: number) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
}

function calculateCpfDigit(base: string) {
  const factorStart = base.length + 1;
  const total = base
    .split("")
    .reduce((sum, digit, index) => sum + Number(digit) * (factorStart - index), 0);

  const rest = (total * 10) % 11;
  return rest === 10 ? "0" : String(rest);
}

export function generateValidCpf() {
  const seed = randomDigits(9);
  const digit1 = calculateCpfDigit(seed);
  const digit2 = calculateCpfDigit(`${seed}${digit1}`);
  return `${seed}${digit1}${digit2}`;
}

export function buildTemporaryEmployeePayload() {
  const cpf = generateValidCpf();
  const suffix = cpf.slice(-4);

  return {
    payload: {
      name: `PW Operador ${suffix}`,
      cpf,
      position: "Operador",
      salary: "1500.00",
      payday: 5,
      status: "ACTIVE" as const,
    },
    login: cpf,
    password: suffix,
    displayName: `PW Operador ${suffix}`,
  };
}

export async function createTemporaryEmployee(
  request: APIRequestContext,
  payload: ReturnType<typeof buildTemporaryEmployeePayload>["payload"],
) {
  const response = await request.post(api.employees.create.path, { data: payload });
  expect(response.status(), "Temporary employee creation should succeed").toBe(201);
  return api.employees.create.responses[201].parse(await response.json());
}

export async function deleteEmployeeIfPossible(
  request: APIRequestContext,
  employeeId: number | null | undefined,
) {
  if (!employeeId) {
    return;
  }

  const response = await request.delete(api.employees.remove.path.replace(":id", String(employeeId)));
  if (response.status() === 404 || response.status() === 409) {
    return;
  }

  expect(response.status(), "Temporary employee cleanup should succeed").toBe(200);
}
