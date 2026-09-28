"use client";

import Link from "next/link";

// Route-level error boundary. Anything that throws while rendering or while a
// page loads lands here instead of a blank screen.

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-red-400">Something went wrong</p>
      <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">We couldn&apos;t load this page.</h1>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        That&apos;s on us. Try again, and if it keeps happening the problem has likely been logged.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={reset}
          className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
        >
          Try again
        </button>
        <Link href="/" className="text-sm text-gray-400 transition-colors hover:text-gray-900">
          Back to the store
        </Link>
      </div>
    </div>
  );
}
