import { z } from "zod";

export function normalizeCpf(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatCpf(value: string): string {
  const digits = normalizeCpf(value);
  if (digits.length !== 11) {
    return value;
  }

  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function isValidCpf(value: string): boolean {
  const digits = normalizeCpf(value);
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) {
    return false;
  }

  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    sum += Number(digits[index]) * (10 - index);
  }

  let checkDigit = (sum * 10) % 11;
  if (checkDigit === 10) {
    checkDigit = 0;
  }

  if (checkDigit !== Number(digits[9])) {
    return false;
  }

  sum = 0;
  for (let index = 0; index < 10; index += 1) {
    sum += Number(digits[index]) * (11 - index);
  }

  checkDigit = (sum * 10) % 11;
  if (checkDigit === 10) {
    checkDigit = 0;
  }

  return checkDigit === Number(digits[10]);
}

export const cpfSchema = z
  .string()
  .trim()
  .refine(isValidCpf, "CPF inválido")
  .transform(normalizeCpf);
