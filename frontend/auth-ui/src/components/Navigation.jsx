import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";

const CATALOG_UI_URL = import.meta.env.VITE_CATALOG_UI_URL || "http://localhost:5174";

const ROLE_AVATAR_BG = {
  student: "from-blue-500 to-indigo-600",
  faculty: "from-emerald-500 to-teal-600",
  librarian: "from-amber-500 to-orange-600",
  admin: "from-purple-500 to-violet-600",
};

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" aria-hidden="true">
      <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

const navLinkClass = ({ isActive }) =>
  `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
    isActive
      ? "text-purple-700 bg-purple-50"
      : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
  }`;

const mobileNavLinkClass = ({ isActive }) =>
  `block px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
    isActive
      ? "bg-purple-50 text-purple-700"
      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
  }`;

export default function Navigation() {
  const navigate = useNavigate();
  const user = authService.getUser();
  const [menuOpen, setMenuOpen] = useState(false);

  const close = () => setMenuOpen(false);

  const handleLogout = async () => {
    try { await authService.logout(); } catch (_) {}
    authService.clearAuth();
    navigate("/login");
  };

  const initials = user
    ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase()
    : "?";
  const avatarGrad = ROLE_AVATAR_BG[user?.role] || "from-purple-500 to-indigo-600";

  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-gray-100 shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white shadow-sm">
            <BookIcon />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold text-slate-900 tracking-tight">Faculty Library</div>
            <div className="text-[10px] font-medium text-gray-400 uppercase tracking-widest hidden sm:block">
              Management System
            </div>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1">
          <NavLink to="/profile" className={navLinkClass}>Profile</NavLink>
          {user?.role === "admin" && (
            <NavLink to="/admin" className={navLinkClass}>Admin</NavLink>
          )}
          <a
            href={CATALOG_UI_URL}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors duration-150"
          >
            Catalog
          </a>
        </nav>

        {/* Desktop user area */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <div
            className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarGrad} flex items-center justify-center text-white text-xs font-bold shadow-sm`}
          >
            {initials}
          </div>
          <span className="text-sm font-semibold text-slate-800 hidden md:block">
            {user?.first_name} {user?.last_name}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-gray-400 hover:text-red-500 transition-colors ml-1"
          >
            Sign out
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <XIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1 shadow-md">
          {/* User identity */}
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarGrad} flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0`}>
              {initials}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-2 space-y-1">
            <NavLink to="/profile" className={mobileNavLinkClass} onClick={close}>Profile</NavLink>
            {user?.role === "admin" && (
              <NavLink to="/admin" className={mobileNavLinkClass} onClick={close}>Admin</NavLink>
            )}
            <a
              href={CATALOG_UI_URL}
              className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              onClick={close}
            >
              Browse Catalog
            </a>
          </div>
          <div className="border-t border-gray-100 pt-2">
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
