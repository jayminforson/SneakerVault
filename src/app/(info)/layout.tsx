import Link from "next/link";
import SiteNav from "@/components/site-nav";

// Shared shell for the long-form content pages (About, FAQ, policies, …).
// Each page inside the group is a server component with its own metadata; the
// footer comes from the root layout.
export default function InfoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <SiteNav>
        <Link href="/" className="text-xs sm:text-sm text-gray-400 hover:text-gray-900 transition-colors flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to the store
        </Link>
      </SiteNav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">{children}</main>
    </div>
  );
}
