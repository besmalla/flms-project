import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";

function EyeIcon({ off }) {
  return off ? (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await authService.login(form);
      authService.saveAuth(res.data.token, res.data.user);
      navigate("/profile");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-slate-50 to-indigo-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] items-stretch">
          {/* Left panel */}
          <div className="hidden lg:flex flex-col justify-between rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-transparent pointer-events-none"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-10">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm ring-1 ring-white/20">
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-purple-300">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-purple-300">Faculty Library</p>
                </div>
              </div>
              <h1 className="text-4xl font-bold leading-tight tracking-tight">
                Welcome back to your library catalog.
              </h1>
              <p className="mt-5 text-sm leading-relaxed text-slate-400">
                Sign in and manage your loans, discover new titles, and keep
                your academic reading on track.
              </p>
            </div>
            <div className="relative mt-8 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
              <p className="text-xs font-bold uppercase tracking-widest text-purple-300 mb-2">Quick note</p>
              <p className="text-sm text-slate-300 leading-relaxed">
                Use your campus credentials to access the library dashboard and
                borrow books immediately.
              </p>
            </div>
          </div>

          {/* Right panel — form */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 flex flex-col justify-center">
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-widest text-purple-500 mb-3">Sign in</p>
              <h2 className="text-2xl font-bold text-slate-900">Library access for students and faculty</h2>
              <p className="mt-2 text-sm text-gray-400">
                Enter your credentials to continue to the library dashboard.
              </p>
            </div>

            {error && (
              <div className="error-box mb-6">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="you@university.edu"
                  className="input-field"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="input-field pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    <EyeIcon off={showPw} />
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Signing in…
                  </span>
                ) : "Sign In"}
              </button>
            </form>

            <p className="text-center text-sm text-gray-400 mt-6">
              No account?{" "}
              <Link to="/register" className="text-purple-600 hover:text-purple-700 font-semibold">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
