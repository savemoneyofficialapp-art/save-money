// Production + Development API Config

const DEV_API = "http://localhost:5000";

const PROD_API =
  "https://save-money-vyv1.onrender.com";

// Auto detect environment
export const API =
  process.env.NODE_ENV === "development"
    ? DEV_API
    : PROD_API;

// Optional helper
export const APP_NAME = "Save Money";

export const APP_VERSION = "1.0.0";