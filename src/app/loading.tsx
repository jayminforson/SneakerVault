// Shown while a route is loading (e.g. between page navigations).

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    </div>
  );
}
