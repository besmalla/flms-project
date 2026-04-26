import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_AUTH_URL || "http://localhost:3001",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("flms_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("flms_token");
      localStorage.removeItem("flms_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

export const authService = {
  register: (data) => api.post("/api/auth/register", data),
  login: (data) => api.post("/api/auth/login", data),
  logout: () => api.post("/api/auth/logout"),
  getProfile: () => api.get("/api/auth/profile"),
  updateProfile: (data) => api.put("/api/auth/profile", data),

  // Local helpers
  saveAuth: (token, user) => {
    localStorage.setItem("flms_token", token);
    localStorage.setItem("flms_user", JSON.stringify(user));
  },
  clearAuth: () => {
    localStorage.removeItem("flms_token");
    localStorage.removeItem("flms_user");
  },
  getToken: () => localStorage.getItem("flms_token"),
  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem("flms_user"));
    } catch {
      return null;
    }
  },
  isAuthenticated: () => !!localStorage.getItem("flms_token"),
};
