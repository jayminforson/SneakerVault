"use client";

import Link from "next/link";

// Page numbers to show: always the first and last, plus a window around the
// current page, with null marking a gap ("…").
function pageList(page: number, totalPages: number): (number | null)[] {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (page >= totalPages - 2) [totalPages - 1, totalPages - 2, totalPages - 3].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(null);
    out.push(p);
  });
  return out;
}

export default function Pagination({
  page,
  totalPages,
  hrefFor,
  onNavigate,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
  onNavigate?: () => void;
}) {
  const base = "min-w-10 h-10 px-3 inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors";
  const arrow = (target: number, label: string, path: string, disabled: boolean) =>
    disabled ? (
      <span className={`${base} text-gray-300 cursor-not-allowed`} aria-hidden="true">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} /></svg>
      </span>
    ) : (
      <Link href={hrefFor(target)} scroll={false} onClick={onNavigate} aria-label={label} className={`${base} text-gray-700 hover:bg-gray-100`}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} /></svg>
      </Link>
    );

  return (
    <nav aria-label="Pagination" className="mt-12 flex flex-col items-center gap-3">
      <div className="flex items-center gap-1 flex-wrap justify-center">
        {arrow(page - 1, "Previous page", "M15 19l-7-7 7-7", page <= 1)}
        {pageList(page, totalPages).map((p, i) =>
          p === null ? (
            <span key={`gap-${i}`} className="px-1 text-gray-400">…</span>
          ) : p === page ? (
            <span key={p} aria-current="page" className={`${base} bg-black text-white`}>{p}</span>
          ) : (
            <Link key={p} href={hrefFor(p)} scroll={false} onClick={onNavigate} className={`${base} text-gray-700 hover:bg-gray-100`}>
              {p}
            </Link>
          )
        )}
        {arrow(page + 1, "Next page", "M9 5l7 7-7 7", page >= totalPages)}
      </div>
      <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
    </nav>
  );
}
