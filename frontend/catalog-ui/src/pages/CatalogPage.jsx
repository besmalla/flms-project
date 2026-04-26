import { useState, useEffect, useCallback } from "react";
import Navigation from "../components/Navigation";
import { catalogService } from "../services/catalogService";

const CATEGORIES = [
  "Computer Science",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Engineering",
  "Databases",
  "Operating Systems",
  "Networking",
  "AI/ML",
  "Business",
  "Economics",
  "Law",
  "Medicine",
  "Arts & Humanities",
];

const CATEGORY_COLORS = {
  "Computer Science": "from-blue-500 to-indigo-600",
  "Mathematics": "from-purple-500 to-violet-600",
  "Physics": "from-sky-500 to-blue-600",
  "Chemistry": "from-teal-500 to-cyan-600",
  "Biology": "from-emerald-500 to-green-600",
  "Engineering": "from-orange-500 to-amber-600",
  "Databases": "from-indigo-500 to-blue-700",
  "Operating Systems": "from-slate-500 to-gray-600",
  "Networking": "from-cyan-500 to-teal-600",
  "AI/ML": "from-violet-500 to-purple-700",
  "Business": "from-amber-500 to-yellow-600",
  "Economics": "from-yellow-500 to-amber-600",
  "Law": "from-red-500 to-rose-600",
  "Medicine": "from-rose-500 to-pink-600",
  "Arts & Humanities": "from-pink-500 to-fuchsia-600",
};

const DEFAULT_GRADIENT = "from-gray-400 to-gray-500";

const CURRENT_YEAR = new Date().getFullYear();

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 text-purple-600" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden="true">
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function CatalogPage() {
  const user = catalogService.getUser();
  const isPriv = ["librarian", "admin"].includes(user?.role);

  const [books, setBooks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [borrowing, setBorrowing] = useState({});
  const [flash, setFlash] = useState({});
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    q: "",
    category: "",
    yearMin: "",
    yearMax: "",
    page: 1,
    limit: 12,
  });

  const [modal, setModal] = useState(null);
  const [bookForm, setBookForm] = useState({
    title: "",
    author: "",
    isbn: "",
    category: "",
    year: "",
    totalCopies: 1,
  });
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");

  const fetchBooks = useCallback(async (params) => {
    setLoading(true);
    setError("");
    try {
      const res = await catalogService.searchBooks(params);
      setBooks(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      setError("Failed to load books. Check that the loan service is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks(filters);
  }, [filters, fetchBooks]);

  const handleFilterChange = (e) => {
    setFilters((p) => ({ ...p, [e.target.name]: e.target.value, page: 1 }));
  };

  const handleBorrow = async (book) => {
    setBorrowing((p) => ({ ...p, [book.id]: true }));
    setFlash((p) => ({ ...p, [book.id]: null }));
    try {
      await catalogService.borrowBook(book.id);
      setFlash((p) => ({
        ...p,
        [book.id]: { type: "success", msg: "Borrowed! Check My Loans." },
      }));
      fetchBooks(filters);
    } catch (err) {
      setFlash((p) => ({
        ...p,
        [book.id]: {
          type: "error",
          msg: err.response?.data?.error || "Borrow failed.",
        },
      }));
    } finally {
      setBorrowing((p) => ({ ...p, [book.id]: false }));
    }
  };

  const openAddModal = () => {
    setBookForm({ title: "", author: "", isbn: "", category: "", year: "", totalCopies: 1 });
    setFormErr("");
    setModal("add");
  };

  const openEditModal = (book) => {
    setBookForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn || "",
      category: book.category || "",
      year: book.year || "",
      totalCopies: book.total_copies,
    });
    setFormErr("");
    setModal(book);
  };

  const handleSaveBook = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormErr("");
    try {
      if (modal === "add") {
        await catalogService.createBook(bookForm);
      } else {
        await catalogService.updateBook(modal.id, bookForm);
      }
      setModal(null);
      fetchBooks(filters);
    } catch (err) {
      setFormErr(err.response?.data?.error || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBook = async (book) => {
    if (!window.confirm(`Remove "${book.title}" from the catalog?`)) return;
    try {
      await catalogService.deleteBook(book.id);
      fetchBooks(filters);
    } catch (err) {
      alert(err.response?.data?.error || "Delete failed.");
    }
  };

  const availableCount = books.filter((b) => b.available_copies > 0).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-slate-50 to-indigo-50">
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero + sidebar */}
        <div className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr] mb-8">
          {/* Hero card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-purple-500 mb-3">
              Explore the collection
            </p>
            <h1 className="text-3xl font-bold text-slate-900 leading-tight">
              Find your next title in the campus library.
            </h1>
            <p className="mt-3 text-sm text-gray-500 max-w-xl leading-relaxed">
              Browse academic and technical books, filter by category, and borrow
              directly from the library dashboard.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="rounded-2xl bg-purple-50 border border-purple-100 px-5 py-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total titles</p>
                <p className="text-3xl font-bold text-purple-800">{pagination.total}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-5 py-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Available now</p>
                <p className="text-3xl font-bold text-emerald-700">{availableCount}</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">
            {isPriv && (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
                  Librarian actions
                </p>
                <h2 className="text-lg font-bold text-slate-900 mb-2">Manage catalog</h2>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  Add, update, or remove titles from the library collection.
                </p>
                <button onClick={openAddModal} className="btn-primary w-full">
                  + Add book
                </button>
              </div>
            )}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-2 text-gray-400 mb-4">
                <FilterIcon />
                <p className="text-xs font-semibold uppercase tracking-widest">Filters</p>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  name="q"
                  value={filters.q}
                  onChange={handleFilterChange}
                  placeholder="Search title, author, or ISBN…"
                  className="input-field"
                />
                <select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="input-field bg-white"
                >
                  <option value="">All categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    name="yearMin"
                    value={filters.yearMin}
                    onChange={handleFilterChange}
                    placeholder="From year"
                    min="1900"
                    max={CURRENT_YEAR}
                    className="input-field"
                  />
                  <input
                    type="number"
                    name="yearMax"
                    value={filters.yearMax}
                    onChange={handleFilterChange}
                    placeholder="To year"
                    min="1900"
                    max={CURRENT_YEAR}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        )}

        {!loading && books.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 mx-auto mb-3 text-gray-300">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-sm font-medium">No books match your search.</p>
            <p className="text-xs mt-1">Try adjusting your filters.</p>
          </div>
        )}

        {!loading && books.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                user={user}
                isPriv={isPriv}
                borrowing={borrowing[book.id]}
                flash={flash[book.id]}
                onBorrow={() => handleBorrow(book)}
                onEdit={() => openEditModal(book)}
                onDelete={() => handleDeleteBook(book)}
              />
            ))}
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              disabled={filters.page <= 1}
              onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
              className="btn-secondary disabled:opacity-40"
            >
              ← Prev
            </button>
            <span className="text-sm text-gray-400 px-4">
              Page {filters.page} of {pagination.pages}
            </span>
            <button
              disabled={filters.page >= pagination.pages}
              onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
              className="btn-secondary disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </main>

      {/* Add/Edit modal */}
      {modal !== null && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          onClick={(e) => e.target === e.currentTarget && setModal(null)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">
                {modal === "add" ? "Add new book" : `Edit: ${modal.title}`}
              </h2>
              <button
                onClick={() => setModal(null)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
                  <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            {formErr && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2.5 text-sm mb-4">
                {formErr}
              </div>
            )}
            <form onSubmit={handleSaveBook} className="space-y-3">
              {[
                { name: "title", label: "Title *", type: "text", required: true },
                { name: "author", label: "Author *", type: "text", required: true },
                { name: "isbn", label: "ISBN", type: "text", required: false },
              ].map(({ name, label, type, required }) => (
                <div key={name}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={bookForm[name]}
                    required={required}
                    onChange={(e) => setBookForm((p) => ({ ...p, [name]: e.target.value }))}
                    className="input-field"
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
                  <select
                    value={bookForm.category}
                    onChange={(e) => setBookForm((p) => ({ ...p, category: e.target.value }))}
                    className="input-field bg-white"
                  >
                    <option value="">Select…</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Year</label>
                  <input
                    type="number"
                    value={bookForm.year}
                    min="1800"
                    max={CURRENT_YEAR}
                    onChange={(e) => setBookForm((p) => ({ ...p, year: e.target.value }))}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Total copies</label>
                <input
                  type="number"
                  value={bookForm.totalCopies}
                  min="0"
                  required
                  onChange={(e) => setBookForm((p) => ({ ...p, totalCopies: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? "Saving…" : "Save book"}
                </button>
                <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function BookCard({ book, user, isPriv, borrowing, flash, onBorrow, onEdit, onDelete }) {
  const available = book.available_copies > 0;
  const canBorrow = ["student", "faculty", "librarian", "admin"].includes(user?.role);
  const gradient = CATEGORY_COLORS[book.category] || DEFAULT_GRADIENT;

  const initials = book.title
    .split(" ")
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || book.title.slice(0, 2).toUpperCase();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden group">
      {/* Cover strip */}
      <div className={`h-24 bg-gradient-to-br ${gradient} flex items-center justify-center relative`}>
        <span className="text-2xl font-black text-white/30 tracking-tighter select-none">
          {initials}
        </span>
        {book.category && (
          <span className="absolute bottom-2 left-3 text-[10px] font-semibold text-white/80 bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
            {book.category}
          </span>
        )}
        {isPriv && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className="w-6 h-6 bg-white/90 hover:bg-white rounded-md flex items-center justify-center text-gray-600 shadow-sm transition-colors"
              title="Edit"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="w-6 h-6 bg-white/90 hover:bg-red-50 rounded-md flex items-center justify-center text-red-400 hover:text-red-600 shadow-sm transition-colors"
              title="Delete"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3">
                <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="font-semibold text-gray-800 text-sm leading-snug mb-1 line-clamp-2">
          {book.title}
        </h3>
        <p className="text-xs text-gray-400 mb-0.5">{book.author}</p>
        {book.year && <p className="text-xs text-gray-300 mb-3">{book.year}</p>}

        <div className="mt-auto space-y-2">
          {available ? (
            <span className="badge-available">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {book.available_copies}/{book.total_copies} available
            </span>
          ) : (
            <span className="badge-unavailable">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
              All copies borrowed
            </span>
          )}

          {flash && (
            <div
              className={`text-xs rounded-lg px-2.5 py-1.5 ${
                flash.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-600 border border-red-200"
              }`}
            >
              {flash.msg}
            </div>
          )}

          {canBorrow && (
            <button
              onClick={onBorrow}
              disabled={!available || borrowing}
              className={`w-full text-xs font-semibold py-2 rounded-xl transition-all duration-150 ${
                available && !borrowing
                  ? "bg-purple-600 hover:bg-purple-700 text-white shadow-sm hover:shadow"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {borrowing ? "Borrowing…" : available ? "Borrow" : "Unavailable"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
