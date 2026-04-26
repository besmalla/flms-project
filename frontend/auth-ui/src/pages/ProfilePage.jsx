import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";

const ROLE_LABELS = {
  student: "Student",
  faculty: "Faculty",
  librarian: "Librarian",
  admin: "Administrator",
};
const ROLE_COLORS = {
  student: "bg-blue-50 text-blue-700 border-blue-200",
  faculty: "bg-emerald-50 text-emerald-700 border-emerald-200",
  librarian: "bg-amber-50 text-amber-700 border-amber-200",
  admin: "bg-purple-50 text-purple-700 border-purple-200",
};
const ROLE_AVATAR_BG = {
  student: "from-blue-500 to-indigo-600",
  faculty: "from-emerald-500 to-teal-600",
  librarian: "from-amber-500 to-orange-600",
  admin: "from-purple-500 to-violet-600",
};

const DEPARTMENTS = [
  "Computer Science", "Mathematics", "Physics", "Chemistry", "Biology",
  "Engineering", "Business", "Economics", "Law", "Medicine",
  "Arts & Humanities", "Social Sciences", "Administration", "Other",
];

const CATALOG_URL = import.meta.env.VITE_API_LOAN_URL
  ? import.meta.env.VITE_API_LOAN_URL.replace(":3002", ":5174")
  : "http://localhost:5174";

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", department: "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [showPws, setShowPws] = useState({ current: false, new: false, confirm: false });
  const [tab, setTab] = useState("profile");
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    authService
      .getProfile()
      .then((res) => {
        setUser(res.data.user);
        setForm({
          firstName: res.data.user.first_name,
          lastName: res.data.user.last_name,
          department: res.data.user.department || "",
        });
      })
      .catch(() => navigate("/login"))
      .finally(() => setFetching(false));
  }, [navigate]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: "", text: "" });
    try {
      const res = await authService.updateProfile(form);
      setUser(res.data.user);
      authService.saveAuth(authService.getToken(), res.data.user);
      setEditing(false);
      setMsg({ type: "success", text: "Profile updated successfully." });
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.error || "Update failed." });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) {
      return setMsg({ type: "error", text: "New passwords do not match." });
    }
    if (pwForm.newPassword.length < 8) {
      return setMsg({ type: "error", text: "New password must be at least 8 characters." });
    }
    setLoading(true);
    setMsg({ type: "", text: "" });
    try {
      await authService.resetPassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
      setMsg({ type: "success", text: "Password changed successfully." });
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.error || "Failed to change password." });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await authService.logout(); } catch (_) {}
    authService.clearAuth();
    navigate("/login");
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-slate-50 to-indigo-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-purple-600">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          <span className="text-sm font-medium">Loading profile…</span>
        </div>
      </div>
    );
  }

  const initials = `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`.toUpperCase();
  const avatarGrad = ROLE_AVATAR_BG[user?.role] || "from-purple-500 to-indigo-600";

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-slate-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white shadow-sm">
              <BookIcon />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold text-slate-900">Faculty Library</div>
              <div className="text-[10px] font-medium text-gray-400 uppercase tracking-widest hidden sm:block">My Account</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={CATALOG_URL}
              className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors hidden sm:block"
            >
              Browse catalog
            </a>
            {user?.role === "admin" && (
              <button
                onClick={() => navigate("/admin")}
                className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
              >
                Admin panel
              </button>
            )}
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-gray-400 hover:text-red-500 transition-colors ml-1"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* User card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-5">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${avatarGrad} flex items-center justify-center text-xl font-bold text-white shadow-md shrink-0`}>
              {initials}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-gray-900 truncate">
                {user?.first_name} {user?.last_name}
              </h2>
              <p className="text-sm text-gray-400 mt-0.5 truncate">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${ROLE_COLORS[user?.role] || ""}`}>
                  {ROLE_LABELS[user?.role] || user?.role}
                </span>
                {user?.department && (
                  <span className="text-xs text-gray-400 font-medium">{user.department}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white border border-gray-100 shadow-sm rounded-2xl p-1.5 w-fit">
          {["profile", "password"].map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setMsg({ type: "", text: "" }); }}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                tab === t
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {t === "profile" ? "Profile" : "Password"}
            </button>
          ))}
        </div>

        {msg.text && (
          <div
            className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm mb-5 border ${
              msg.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 shrink-0 mt-0.5">
              {msg.type === "success" ? (
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              ) : (
                <>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </>
              )}
            </svg>
            {msg.text}
          </div>
        )}

        {tab === "profile" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            {!editing ? (
              <div>
                <div className="grid grid-cols-2 gap-5 mb-6">
                  <InfoField label="First name" value={user?.first_name} />
                  <InfoField label="Last name" value={user?.last_name} />
                  <InfoField label="Email" value={user?.email} />
                  <InfoField label="Department" value={user?.department || "—"} />
                </div>
                <button
                  onClick={() => setEditing(true)}
                  className="btn-primary"
                >
                  Edit Profile
                </button>
              </div>
            ) : (
              <form onSubmit={handleProfileSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      First name
                    </label>
                    <input
                      type="text"
                      value={form.firstName}
                      required
                      onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Last name
                    </label>
                    <input
                      type="text"
                      value={form.lastName}
                      required
                      onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Department
                  </label>
                  <select
                    value={form.department}
                    onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                    className="input-field bg-white"
                  >
                    <option value="">None</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
                    {loading ? "Saving…" : "Save changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {tab === "password" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <form onSubmit={handlePasswordSave} className="space-y-4 max-w-sm">
              {[
                { name: "currentPassword", label: "Current password", key: "current" },
                { name: "newPassword", label: "New password", key: "new" },
                { name: "confirm", label: "Confirm new password", key: "confirm" },
              ].map(({ name, label, key }) => (
                <div key={name}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    {label}
                  </label>
                  <div className="relative">
                    <input
                      type={showPws[key] ? "text" : "password"}
                      value={pwForm[name]}
                      required
                      onChange={(e) => setPwForm((p) => ({ ...p, [name]: e.target.value }))}
                      placeholder="••••••••"
                      className="input-field pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPws((p) => ({ ...p, [key]: !p[key] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPws[key] ? (
                        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50"
              >
                {loading ? "Updating…" : "Change password"}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

function InfoField({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value}</p>
    </div>
  );
}
