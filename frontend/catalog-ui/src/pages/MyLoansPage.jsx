import { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import { catalogService } from "../services/catalogService";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function daysUntil(iso) {
  const diff = new Date(iso) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 text-purple-600" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

export default function MyLoansPage() {
  const user = catalogService.getUser();
  const isPriv = ["librarian", "admin"].includes(user?.role);

  const [tab, setTab] = useState("active");
  const [active, setActive] = useState([]);
  const [history, setHistory] = useState([]);
  const [allLoans, setAllLoans] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [histPage, setHistPage] = useState(1);
  const [allPage, setAllPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState({});
  const [flash, setFlash] = useState({});
  const [error, setError] = useState("");

  const loadActive = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await catalogService.getMyLoans();
      setActive(res.data.data);
    } catch {
      setError("Could not load active loans.");
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const res = await catalogService.getLoanHistory({ page, limit: 10 });
      setHistory(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      setError("Could not load loan history.");
    } finally {
      setLoading(false);
    }
  };

  const loadAllLoans = async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const res = await catalogService.getAllLoans({ page, limit: 15 });
      setAllLoans(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      setError("Could not load all loans.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "active") loadActive();
    if (tab === "history") loadHistory(histPage);
    if (tab === "all") loadAllLoans(allPage);
  }, [tab, histPage, allPage]);

  const handleReturn = async (loanId) => {
    setActing((p) => ({ ...p, [loanId]: true }));
    setFlash((p) => ({ ...p, [loanId]: null }));
    try {
      await catalogService.returnBook(loanId);
      setFlash((p) => ({ ...p, [loanId]: { type: "success", msg: "Returned successfully." } }));
      loadActive();
    } catch (err) {
      setFlash((p) => ({
        ...p,
        [loanId]: { type: "error", msg: err.response?.data?.error || "Return failed." },
      }));
    } finally {
      setActing((p) => ({ ...p, [loanId]: false }));
    }
  };

  const handleRenew = async (loanId) => {
    setActing((p) => ({ ...p, [loanId]: true }));
    setFlash((p) => ({ ...p, [loanId]: null }));
    try {
      const res = await catalogService.renewLoan(loanId);
      const newDue = formatDate(res.data.loan.due_date);
      setFlash((p) => ({
        ...p,
        [loanId]: { type: "success", msg: `Renewed! New due: ${newDue}` },
      }));
      loadActive();
    } catch (err) {
      setFlash((p) => ({
        ...p,
        [loanId]: { type: "error", msg: err.response?.data?.error || "Renewal failed." },
      }));
    } finally {
      setActing((p) => ({ ...p, [loanId]: false }));
    }
  };

  const tabs = [
    { id: "active", label: "Active", count: active.length },
    { id: "history", label: "History", count: null },
    ...(isPriv ? [{ id: "all", label: "All Loans", count: null }] : []),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-slate-50 to-indigo-50">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-purple-500 mb-1">Library</p>
          <h1 className="text-2xl font-bold text-slate-900">My Loans</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white border border-gray-100 shadow-sm rounded-2xl p-1.5 w-fit">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                tab === t.id
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {t.label}
              {t.count !== null && (
                <span
                  className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                    tab === t.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}

        {/* Active loans */}
        {!loading && tab === "active" && (
          <>
            {active.length === 0 ? (
              <EmptyState text="No active loans yet." sub="Visit the catalog to borrow a title." />
            ) : (
              <div className="space-y-3">
                {active.map((loan) => {
                  const days = daysUntil(loan.due_date);
                  const overdue = loan.computed_status === "overdue" || days < 0;
                  const nearDue = !overdue && days <= 3;
                  const canRenew = loan.renewals_used < 2;
                  const f = flash[loan.id];

                  return (
                    <div
                      key={loan.id}
                      className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${
                        overdue
                          ? "border-red-200 bg-red-50/30"
                          : nearDue
                            ? "border-amber-200 bg-amber-50/20"
                            : "border-gray-100"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              overdue ? "bg-red-100" : nearDue ? "bg-amber-100" : "bg-purple-100"
                            }`}>
                              <svg viewBox="0 0 24 24" fill="none" className={`w-5 h-5 ${overdue ? "text-red-500" : nearDue ? "text-amber-600" : "text-purple-600"}`}>
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-gray-800 text-sm truncate">{loan.title}</h3>
                              <p className="text-xs text-gray-400 mt-0.5">{loan.author}</p>
                              <div className="flex flex-wrap items-center gap-3 mt-2">
                                <span className="text-xs text-gray-400">
                                  Borrowed {formatDate(loan.borrowed_at)}
                                </span>
                                <span
                                  className={`text-xs font-semibold ${
                                    overdue ? "text-red-600" : nearDue ? "text-amber-600" : "text-gray-500"
                                  }`}
                                >
                                  Due {formatDate(loan.due_date)}
                                  {overdue && " · Overdue"}
                                  {!overdue && nearDue && ` · ${days}d left`}
                                </span>
                                <span className="text-xs text-gray-300">
                                  {loan.renewals_used}/2 renewals
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 shrink-0">
                          <button
                            onClick={() => handleRenew(loan.id)}
                            disabled={!canRenew || acting[loan.id]}
                            className="text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                          >
                            {acting[loan.id] ? "…" : "Renew"}
                          </button>
                          <button
                            onClick={() => handleReturn(loan.id)}
                            disabled={acting[loan.id]}
                            className="text-xs font-semibold bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 whitespace-nowrap"
                          >
                            {acting[loan.id] ? "…" : "Return"}
                          </button>
                        </div>
                      </div>

                      {overdue && (
                        <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 font-medium">
                          <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 shrink-0">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                            <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                          This loan is overdue. Please return it as soon as possible.
                        </div>
                      )}

                      {f && (
                        <div
                          className={`mt-2 text-xs rounded-lg px-3 py-1.5 border ${
                            f.type === "success"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-red-50 text-red-600 border-red-200"
                          }`}
                        >
                          {f.msg}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* History */}
        {!loading && tab === "history" && (
          <>
            {history.length === 0 ? (
              <EmptyState text="No returned books yet." sub="" />
            ) : (
              <>
                <div className="space-y-2">
                  {history.map((loan) => (
                    <div
                      key={loan.id}
                      className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-start justify-between gap-4"
                    >
                      <div>
                        <h3 className="font-semibold text-gray-700 text-sm">{loan.title}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{loan.author}</p>
                      </div>
                      <div className="text-xs text-gray-400 text-right shrink-0">
                        <p>Borrowed {formatDate(loan.borrowed_at)}</p>
                        <p className="text-gray-300 mt-0.5">Returned {formatDate(loan.returned_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Pagination pagination={pagination} page={histPage} setPage={setHistPage} />
              </>
            )}
          </>
        )}

        {/* All loans (librarian/admin) */}
        {!loading && tab === "all" && (
          <>
            {allLoans.length === 0 ? (
              <EmptyState text="No loans found." sub="" />
            ) : (
              <>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/60">
                          <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Book</th>
                          <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Borrower</th>
                          <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Due</th>
                          <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                          <th className="px-5 py-3.5"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {allLoans.map((loan) => {
                          const overdue = loan.computed_status === "overdue";
                          const returned = loan.computed_status === "returned";
                          return (
                            <tr key={loan.id} className="hover:bg-purple-50/20 transition-colors">
                              <td className="px-5 py-3.5">
                                <p className="font-semibold text-gray-800 truncate max-w-[180px]">{loan.title}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{loan.author}</p>
                              </td>
                              <td className="px-5 py-3.5">
                                <p className="font-medium text-gray-700">{loan.first_name} {loan.last_name}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{loan.email}</p>
                              </td>
                              <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap text-xs">
                                {formatDate(loan.due_date)}
                              </td>
                              <td className="px-5 py-3.5">
                                <span
                                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                                    overdue
                                      ? "bg-red-50 text-red-600 border-red-200"
                                      : returned
                                        ? "bg-gray-50 text-gray-500 border-gray-200"
                                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${overdue ? "bg-red-400" : returned ? "bg-gray-300" : "bg-emerald-500"}`}></span>
                                  {loan.computed_status}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                {!returned && (
                                  <button
                                    onClick={() => handleReturn(loan.id)}
                                    disabled={acting[loan.id]}
                                    className="text-xs font-semibold bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                                  >
                                    {acting[loan.id] ? "…" : "Return"}
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                <Pagination pagination={pagination} page={allPage} setPage={setAllPage} />
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function EmptyState({ text, sub }) {
  return (
    <div className="text-center py-20">
      <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-gray-400">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <p className="text-sm font-semibold text-gray-500">{text}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function Pagination({ pagination, page, setPage }) {
  if (pagination.pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        disabled={page <= 1}
        onClick={() => setPage((p) => p - 1)}
        className="btn-secondary disabled:opacity-40"
      >
        ← Prev
      </button>
      <span className="text-sm text-gray-400 px-3">
        {page} / {pagination.pages}
      </span>
      <button
        disabled={page >= pagination.pages}
        onClick={() => setPage((p) => p + 1)}
        className="btn-secondary disabled:opacity-40"
      >
        Next →
      </button>
    </div>
  );
}
