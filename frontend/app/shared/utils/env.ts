// Ensure field exists in .env file and returns its value
function requireEnv(key: string): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`[ENV] Missing required env field: ${key}`);
  }
  return value;
}

export const env = {
  API_URL: requireEnv("VITE_API_BASE_URL"),
};

export function getEnv() {
  return env;
}
