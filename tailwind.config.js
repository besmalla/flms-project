import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";

const ROLES = ["student", "faculty", "librarian", "admin"];

const ROLE_COLORS = {
  student: "bg-blue-50 text-blue-700 border-blue-200",
  faculty: "bg-emerald-50 text-emerald-700 border-emerald-200",
  librarian: "bg-amber-50 text-amber-700 border-amber-200",
  admin: "bg-purple-50 text-purple-700 border-purple-200",
};

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-gray-400 shrink-0" aria-hidden="true">
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/>
      <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

export default function AdminPage() {
  const navigate = useNavigate();
  const currentUser = authService.getUser();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ role: "", search: "", page: 1, limit: 20 });

  const fetchUsers = useCallback(async (params) => {
    setLoading(true);
    try {
      const res = await authService.getUsers(params);
      setUsers(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(filters);
  }, [fetchUsers, filters]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await authService.updateUserRole(userId, newRole);
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch {
      alert("Failed to update role");
    }
  };

  const handleDeactivate = async (userId) => {
    if (!confirm("Are you sure you want to deactivate this user?")) return;
    try {
      await authService.deactivateUser(userId);
      setUsers(users.map((u) => (u.id === userId ? { ...u, is_active: false } : u)));
    } catch {
      alert("Failed to deactivate user");
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const activeCount = users.filter((u) => u.is_active).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-slate-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/profile")}
              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
              aria-label="Back to profile"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                <path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white shadow-sm">
                <UsersIcon />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">User Management</div>
                <div className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Admin Panel</div>
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-400 hidden sm:block">
            Signed in as <span className="font-semibold text-gray-600">{currentUser?.first_name} {currentUser?.last_name}</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Users", value: pagination.total, color: "text-slate-700" },
            { label: "Shown", value: users.length, color: "text-purple-700" },
            { label: "Active", value: activeCount, color: "text-emerald-700" },
            { label: "Inactive", value: users.length - activeCount, color: "text-red-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] border border-gray-200 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-purple-400/50 focus-within:border-purple-400 transition-all bg-gray-50/50">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="flex-1 bg-transparent text-sm focus:outline-none text-gray-700 placeholder-gray-400"
            />
          </div>
          <select
            value={filters.role}
            onChange={(e) => handleFilterChange("role", e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50/50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400 transition-all cursor-pointer"
          >
            <option value="">All Roles</option>
            {ROLES.map((role) => (
              <option key={role} value={role} className="capitalize">
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <svg className="animate-spin h-5 w-5 mr-2 text-purple-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Loading users…
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-gray-200"></div>
              <p className="text-sm">No users match your search.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                    <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Email</th>
                    <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                    <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="py-3.5 px-5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    return (
                      <tr key={u.id} className="hover:bg-purple-50/30 transition-colors group">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {u.first_name?.[0]}{u.last_name?.[0]}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">
                                {u.first_name} {u.last_name}
                                {isSelf && <span className="ml-1.5 text-xs font-medium text-purple-500">(you)</span>}
                              </p>
                              <p className="text-xs text-gray-400 sm:hidden">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 hidden sm:table-cell">
                          <span className="text-sm text-gray-500">{u.email}</span>
                        </td>
                        <td className="py-3.5 px-5">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            disabled={isSelf}
                            className={`text-xs font-semibold border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-default ${ROLE_COLORS[u.role] || "bg-gray-50 text-gray-600 border-gray-200"}`}
                          >
                            {ROLES.map((role) => (
                              <option key={role} value={role}>
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3.5 px-5">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                              u.is_active
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-red-50 text-red-600 border-red-200"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? "bg-emerald-500" : "bg-red-400"}`}></span>
                            {u.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          {!isSelf && u.is_active && (
                            <button
                              onClick={() => handleDeactivate(u.id)}
                              className="text-xs font-medium text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              Deactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
          <p className="text-sm text-gray-400">
            Showing <span className="font-semibold text-gray-600">{users.length}</span> of{" "}
            <span className="font-semibold text-gray-600">{pagination.total}</span> users
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page <= 1}
              className="btn-secondary disabled:opacity-40"
            >
              ← Prev
            </button>
            <span className="text-sm text-gray-500 px-3">
              {pagination.page} / {pagination.pages}
            </span>
            <button
              onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= pagination.pages}
              className="btn-secondary disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
