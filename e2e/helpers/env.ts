export function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const e2eEnv = {
  baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:5000",
  adminLogin: () => requireEnv("E2E_ADMIN_LOGIN"),
  adminPassword: () => requireEnv("E2E_ADMIN_PASSWORD"),
};
