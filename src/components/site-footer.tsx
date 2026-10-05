"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const columns: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Shop",
    links: [
      { label: "Home", href: "/" },
      { label: "Cart", href: "/cart" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "FAQ", href: "/faqs" },
      { label: "Customer Feedback", href: "/feedback" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  {
    heading: "Policies",
    links: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Delivery & Returns", href: "/delivery-returns" },
    ],
  },
];

// Rendered once from the root layout. The admin section keeps its own chrome,
// so the footer disappears there instead of exposing storefront links.
export default function SiteFooter() {
  const pathname = usePathname();
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return null;

  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          {columns.map((col) => (
            <div key={col.heading}>
              <h2 className="text-xs uppercase tracking-wider font-semibold text-gray-900 mb-3">{col.heading}</h2>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h2 className="text-xs uppercase tracking-wider font-semibold text-gray-900 mb-3">Contact</h2>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>
                <a href="mailto:boatengkissibenjamin@gmail.com" className="hover:text-gray-900 transition-colors break-all">
                  boatengkissibenjamin@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:+233556600144" className="hover:text-gray-900 transition-colors">+233 556600144</a>
              </li>
              <li>Ablekuma, Accra, Ghana</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <p>© 2026 SneakerVault. All rights reserved.</p>
          <p>Payments secured by Paystack</p>
        </div>
      </div>
    </footer>
  );
}
