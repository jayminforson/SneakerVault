import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-gray-400">404</p>
      <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">This page doesn&apos;t exist.</h1>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        The link may be broken, or the pair you were looking for is no longer listed.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Link
          href="/"
          className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
        >
          Back to the store
        </Link>
        <Link href="/admin" className="text-sm text-gray-400 transition-colors hover:text-gray-900">
          Admin
        </Link>
      </div>
    </div>
  );
}
