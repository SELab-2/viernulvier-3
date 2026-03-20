export const runtimeEnv = {
  API_BASE_URL: process.env.VITE_API_BASE_URL,
};

export function getEnv() {
  if (typeof window !== "undefined") {
    return window.__ENV__;
  }

  return {
    API_BASE_URL: process.env.VITE_API_BASE_URL,
  };
}
