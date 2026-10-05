import type { Metadata } from "next";
import Link from "next/link";
import { getSneakers } from "@/lib/db";

// Ratings are read live so the page never shows a stale average.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Customer Feedback",
  description:
    "See how customers rate the sneakers at SneakerVault and send us your own feedback.",
  alternates: { canonical: "/feedback" },
};

function Stars({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 ${i < filled ? "text-amber-400" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      ))}
    </span>
  );
}

export default async function FeedbackPage() {
  const sneakers = await getSneakers();
  const rated = sneakers.filter((s) => s.reviewCount > 0);
  const totalRatings = rated.reduce((sum, s) => sum + s.reviewCount, 0);
  const average = totalRatings > 0
    ? rated.reduce((sum, s) => sum + s.rating * s.reviewCount, 0) / totalRatings
    : 0;

  return (
    <div className="animate-fade-in">
      <p className="text-xs uppercase tracking-wider font-medium text-gray-400">Reviews</p>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">Customer feedback</h1>
      <p className="mt-3 text-sm text-gray-500 leading-relaxed">
        Ratings come from customers who have ordered from SneakerVault. Every product page
        shows its own score, and the summary below is calculated across the catalogue.
      </p>

      {totalRatings > 0 ? (
        <>
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm flex items-center gap-5">
            <div className="text-center">
              <p className="text-4xl font-bold tracking-tight tabular-nums">{average.toFixed(1)}</p>
              <p className="text-xs text-gray-400 mt-0.5">out of 5</p>
            </div>
            <div className="border-l border-gray-100 pl-5">
              <Stars rating={average} />
              <p className="mt-1.5 text-sm text-gray-500">
                {totalRatings.toLocaleString()} customer rating{totalRatings === 1 ? "" : "s"} across {rated.length} product{rated.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="mt-4 bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100 shadow-sm">
            {rated.map((s) => (
              <Link key={s.id} href={`/sneaker?id=${s.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                <span className="min-w-0">
                  <span className="block text-[11px] text-gray-400 uppercase tracking-wider font-medium">{s.brand}</span>
                  <span className="block text-sm font-medium truncate">{s.name}</span>
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  <Stars rating={s.rating} />
                  <span className="text-sm font-semibold tabular-nums">{s.rating.toFixed(1)}</span>
                  <span className="text-xs text-gray-400 tabular-nums">({s.reviewCount.toLocaleString()})</span>
                </span>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
          <p className="text-sm text-gray-500 leading-relaxed">
            Be the first to review a pair — your feedback helps other shoppers choose.
          </p>
        </div>
      )}

      <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
        <h2 className="text-base font-semibold">Share your experience</h2>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
          Bought from us? Tell us how it went — what you ordered, how the fit was and how
          delivery went. We read everything and reply within one working day.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="mailto:boatengkissibenjamin@gmail.com?subject=SneakerVault%20feedback"
            className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
          >
            Send feedback
          </a>
          <a href="tel:+233556600144" className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
            Call or WhatsApp us
          </a>
        </div>
      </div>
    </div>
  );
}
