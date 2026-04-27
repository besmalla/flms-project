@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  body {
    @apply bg-slate-50 text-gray-800;
  }
  *::selection {
    @apply bg-purple-200 text-purple-900;
  }
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    @apply bg-transparent;
  }
  ::-webkit-scrollbar-thumb {
    @apply bg-gray-300 rounded-full;
  }
  ::-webkit-scrollbar-thumb:hover {
    @apply bg-gray-400;
  }
}

@layer components {
  .btn-primary {
    @apply inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-semibold py-2.5 px-5 rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md text-sm tracking-wide;
  }
  .btn-secondary {
    @apply inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-medium py-2.5 px-5 rounded-xl border border-gray-200 transition-all duration-150 text-sm;
  }
  .btn-danger {
    @apply inline-flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2.5 px-5 rounded-xl border border-red-200 transition-all duration-150 text-sm;
  }
  .input-field {
    @apply w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400 transition-all duration-150 hover:border-gray-300;
  }
  .card {
    @apply bg-white rounded-2xl shadow-sm border border-gray-100 p-6;
  }
  .error-box {
    @apply flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm;
  }
  .success-box {
    @apply flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm;
  }
  .label {
    @apply block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5;
  }
  .page-bg {
    @apply min-h-screen bg-gradient-to-br from-purple-50 via-slate-50 to-indigo-50;
  }
}
