import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Validate that backend URL is configured
if (!BACKEND_URL) {
  console.error(
    "❌ REACT_APP_BACKEND_URL not configured!\n" +
    "Please set REACT_APP_BACKEND_URL environment variable.\n" +
    "Example: REACT_APP_BACKEND_URL=https://api.example.com"
  );
}

export const API = `${BACKEND_URL || "http://localhost:8000"}/api`;

export const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("⚠️ Unauthorized - redirecting to login");
    } else if (error.code === "ERR_NETWORK") {
      console.error("❌ Network error - backend may be unavailable");
    }
    return Promise.reject(error);
  }
);

export function formatApiErrorDetail(detail) {
  if (detail == null) return "A apărut o eroare. Încearcă din nou.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}
