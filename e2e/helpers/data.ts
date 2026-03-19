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
      name: `PW Operador ${suffix}` ,
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

export function buildTemporaryInvoicePayload(attachmentId: number) {
  const suffix = `${Date.now()}${randomDigits(3)}`;
  const competenceMonth = new Date().toISOString().slice(0, 7);

  return {
    number: `PW-${suffix}`,
    payload: {
      attachmentId,
      number: `PW-${suffix}`,
      issueDate: new Date(`${competenceMonth}-20T00:00:00.000Z`),
      competenceMonth,
      periodType: "B_16_END" as const,
      amount: "321.45",
      status: "ISSUED" as const,
    },
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

export async function uploadTemporaryInvoiceAttachment(request: APIRequestContext) {
  const pdfBuffer = Buffer.from(
    [
      "%PDF-1.4",
      "1 0 obj",
      "<< /Type /Catalog /Pages 2 0 R >>",
      "endobj",
      "2 0 obj",
      "<< /Type /Pages /Count 1 /Kids [3 0 R] >>",
      "endobj",
      "3 0 obj",
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >>",
      "endobj",
      "trailer",
      "<< /Root 1 0 R >>",
      "%%EOF",
    ].join("\n"),
    "utf8",
  );

  const response = await request.post(api.uploads.upload.path, {
    multipart: {
      file: {
        name: `pw-invoice-${Date.now()}.pdf`,
        mimeType: "application/pdf",
        buffer: pdfBuffer,
      },
    },
  });

  expect(response.status(), "Temporary invoice attachment upload should succeed").toBe(201);
  return api.uploads.upload.responses[201].parse(await response.json());
}

export async function createTemporaryInvoice(
  request: APIRequestContext,
  payload: ReturnType<typeof buildTemporaryInvoicePayload>["payload"],
) {
  const response = await request.post(api.invoices.create.path, { data: payload });
  expect(response.status(), "Temporary invoice creation should succeed").toBe(201);
  return api.invoices.create.responses[201].parse(await response.json());
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

export async function deleteInvoiceIfPossible(
  request: APIRequestContext,
  invoiceId: number | null | undefined,
) {
  if (!invoiceId) {
    return;
  }

  const response = await request.delete(api.invoices.remove.path.replace(":id", String(invoiceId)));
  if (response.status() === 404) {
    return;
  }

  expect(response.status(), "Temporary invoice cleanup should succeed").toBe(200);
}
