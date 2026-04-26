import axios from "axios";
import { authService } from "./authService";

const AUTH_URL = import.meta.env.VITE_API_AUTH_URL || "http://localhost:3001";
const LOAN_URL = import.meta.env.VITE_API_LOAN_URL || "http://localhost:3002";

const api = axios.create({
  baseURL: LOAN_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = authService.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      authService.clearAuth();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

export const catalogService = {
  // Catalog
  searchBooks: (params) => api.get("/api/catalog/search", { params }),
  getBookById: (id) => api.get(`/api/catalog/books/${id}`),
  createBook: (data) => api.post("/api/catalog/books", data),
  updateBook: (id, data) => api.put(`/api/catalog/books/${id}`, data),
  deleteBook: (id) => api.delete(`/api/catalog/books/${id}`),
  importBooks: (books) => api.post("/api/catalog/import", { books }),

  // Loans
  borrowBook: (bookId) => api.post("/api/loans/borrow", { bookId }),
  returnBook: (loanId) => api.post("/api/loans/return", { loanId }),
  renewLoan: (loanId) => api.post("/api/loans/renew", { loanId }),
  getMyLoans: () => api.get("/api/loans/my-loans"),
  getLoanHistory: (params) => api.get("/api/loans/history", { params }),
  getAllLoans: (params) => api.get("/api/loans", { params }),

  // Local helpers
  getUser: () => authService.getUser(),
  getToken: () => authService.getToken(),
  isAuthenticated: () => authService.isAuthenticated(),
};
