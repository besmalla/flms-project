import { NavLink, useNavigate } from "react-router-dom";
import { catalogService } from "../services/catalogService";

const ROLE_LABELS = {
  student: "Student",
  faculty: "Faculty",
  librarian: "Librarian",
  admin: "Admin",
};

const ROLE_COLORS = {
  student: "bg-blue-100 text-blue-700",
  faculty: "bg-emerald-100 text-emerald-700",
  librarian: "bg-amber-100 text-amber-700",
  admin: "bg-purple-100 text-purple-700",
};

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" aria-hidden="true">
      <path
        d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Navigation() {
  const navigate = useNavigate();
  const user = catalogService.getUser();
  const isPriv = ["librarian", "admin"].includes(user?.role);
  const authUiUrl = (
    import.meta.env.VITE_API_AUTH_URL || "http://localhost:3001"
  ).replace(":3001", ":5173");

  const handleLogout = () => {
    localStorage.removeItem("flms_token");
    localStorage.removeItem("flms_user");
    window.location.href = `${authUiUrl}/login`;
  };

  const initials = user
    ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase()
    : "?";

  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-gray-100 shadow-sm sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white shadow-sm">
            <BookIcon />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold text-slate-900 tracking-tight">
              Faculty Library
            </div>
            <div className="text-[10px] font-medium text-gray-400 uppercase tracking-widest hidden sm:block">
              Management System
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          <NavLink
            to="/catalog"
            className={({ isActive }) =>
              `relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? "text-purple-700 bg-purple-50"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              }`
            }
          >
            Catalog
          </NavLink>
          <NavLink
            to="/my-loans"
            className={({ isActive }) =>
              `relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? "text-purple-700 bg-purple-50"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              }`
            }
          >
            My Loans
          </NavLink>
        </nav>

        {/* User area */}
        <div className="flex items-center gap-3 shrink-0">
          {isPriv && (
            <span
              className={`hidden sm:inline-flex text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_COLORS[user.role]}`}
            >
              {ROLE_LABELS[user.role]}
            </span>
          )}
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <span className="text-sm font-semibold text-slate-800">
              {user?.first_name} {user?.last_name}
            </span>
            {!isPriv && (
              <span className="text-xs text-gray-400">
                {ROLE_LABELS[user?.role]}
              </span>
            )}
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
            {initials}
          </div>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-gray-400 hover:text-red-500 transition-colors duration-150 ml-1"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
