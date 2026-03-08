import fs from "fs/promises";
import { PDFParse } from "pdf-parse";
import { INVOICE_PERIODS, INVOICE_STATUS } from "@shared/schema";

type InvoiceDraft = {
  number: string | null;
  issueDate: string | null;
  competenceMonth: string | null;
  periodType: keyof typeof INVOICE_PERIODS;
  amount: string | null;
  status: keyof typeof INVOICE_STATUS;
};

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseBrazilianNumber(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : null;
}

function inferPeriodFromIssueDate(issueDate: string | null) {
  if (!issueDate) {
    return INVOICE_PERIODS.A_01_15;
  }

  const day = new Date(issueDate).getDate();
  return day <= 15 ? INVOICE_PERIODS.A_01_15 : INVOICE_PERIODS.B_16_END;
}

function extractIssueDate(text: string) {
  const labeledMatch =
    text.match(/DATA\s+DE\s+EMISSAO[^\d]{0,20}(\d{2}\/\d{2}\/\d{4})/i) ??
    text.match(/EMISSAO[^\d]{0,20}(\d{2}\/\d{2}\/\d{4})/i);

  const fallbackMatch = text.match(/\b(\d{2}\/\d{2}\/\d{4})\b/);
  const rawDate = labeledMatch?.[1] ?? fallbackMatch?.[1];
  if (!rawDate) {
    return null;
  }

  const [day, month, year] = rawDate.split("/");
  return `${year}-${month}-${day}`;
}

function extractInvoiceNumber(text: string, filename: string) {
  const labeledMatch =
    text.match(/(?:NF-?E|NOTA\s+FISCAL)[^\d]{0,30}N(?:UMERO|º|O)?[^\d]{0,10}(\d{3,12})/i) ??
    text.match(/NUMERO[^\d]{0,10}(\d{3,12})/i);

  if (labeledMatch?.[1]) {
    return labeledMatch[1];
  }

  const filenameMatch = filename.match(/(\d{4,12})/);
  return filenameMatch?.[1] ?? null;
}

function extractAmount(text: string) {
  const labelPatterns = [
    /VALOR\s+TOTAL\s+DA\s+NOTA[^\d]{0,20}(\d{1,3}(?:\.\d{3})*,\d{2})/i,
    /VALOR\s+TOTAL[^\d]{0,20}(\d{1,3}(?:\.\d{3})*,\d{2})/i,
    /VALOR\s+A\s+PAGAR[^\d]{0,20}(\d{1,3}(?:\.\d{3})*,\d{2})/i,
  ];

  for (const pattern of labelPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return parseBrazilianNumber(match[1]);
    }
  }

  const currencyMatches = Array.from(text.matchAll(/\b(\d{1,3}(?:\.\d{3})*,\d{2})\b/g))
    .map((match) => parseBrazilianNumber(match[1]))
    .filter((value): value is string => Boolean(value))
    .map(Number)
    .filter((value) => value > 0);

  if (currencyMatches.length === 0) {
    return null;
  }

  return Math.max(...currencyMatches).toFixed(2);
}

async function extractTextFromPdf(filePath: string) {
  const buffer = await fs.readFile(filePath);
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text ?? "";
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

export async function extractInvoiceDraftFromFile(file: {
  path: string;
  filename: string;
  mimetype: string;
}) {
  const warnings: string[] = [];
  let rawText = "";

  if (file.mimetype === "application/pdf") {
    try {
      rawText = await extractTextFromPdf(file.path);
    } catch {
      warnings.push("Nao foi possivel ler automaticamente o PDF. Revise os campos manualmente.");
    }
  } else {
    warnings.push("Extracao automatica completa esta disponivel apenas para PDF por enquanto.");
  }

  const normalizedText = normalizeSearchText(rawText);
  const issueDate = extractIssueDate(normalizedText);
  const competenceMonth = issueDate ? issueDate.slice(0, 7) : null;

  const draft: InvoiceDraft = {
    number: extractInvoiceNumber(normalizedText, file.filename),
    issueDate,
    competenceMonth,
    periodType: inferPeriodFromIssueDate(issueDate),
    amount: extractAmount(normalizedText),
    status: INVOICE_STATUS.ISSUED,
  };

  if (!draft.issueDate) {
    warnings.push("Data de emissao nao identificada automaticamente.");
  }
  if (!draft.amount) {
    warnings.push("Valor da nota nao identificado automaticamente.");
  }
  if (!draft.number) {
    warnings.push("Numero da nota nao identificado automaticamente.");
  }

  return { draft, warnings };
}
