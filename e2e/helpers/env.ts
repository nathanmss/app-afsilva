import fs from "fs";

export function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

let cachedLocalEnv: Record<string, string> | null = null;

function readLocalEnv(name: string) {
  if (!cachedLocalEnv) {
    cachedLocalEnv = {};
    const envPath = new URL("../../.env", import.meta.url);
    const text = fs.readFileSync(envPath, "utf8");

    text.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        return;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) {
        return;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      cachedLocalEnv[key] = value;
    });
  }

  const value = cachedLocalEnv[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const e2eEnv = {
  baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:5000",
  adminLogin: () => requireEnv("E2E_ADMIN_LOGIN"),
  adminPassword: () => requireEnv("E2E_ADMIN_PASSWORD"),
  databaseURL: () => process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL ?? readLocalEnv("DATABASE_URL"),
};
