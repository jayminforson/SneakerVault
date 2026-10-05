import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Email or call SneakerVault in Ablekuma, Accra for help with an order, a size, a delivery or a return.",
  alternates: { canonical: "/contact" },
};

const channels = [
  {
    title: "Email",
    value: "boatengkissibenjamin@gmail.com",
    href: "mailto:boatengkissibenjamin@gmail.com",
    note: "Best for order questions and returns — we reply within one working day.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    ),
  },
  {
    title: "Phone & WhatsApp",
    value: "+233 556600144",
    href: "tel:+233556600144",
    note: "Call or message us — Ablekuma, Accra, Ghana.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    ),
  },
  {
    title: "Office",
    value: "Ablekuma, Accra",
    href: null,
    note: "Online-only store — orders are placed here and delivered to you.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    ),
  },
];

export default function ContactPage() {
  return (
    <div className="animate-fade-in">
      <p className="text-xs uppercase tracking-wider font-medium text-gray-400">Support</p>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">Contact us</h1>
      <p className="mt-3 text-sm text-gray-500 leading-relaxed">
        Questions about a pair, your size, an order or a return? Reach us any way you like —
        we aim to reply within one working day.
      </p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {channels.map((channel) => {
          const inner = (
            <>
              <span className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  {channel.icon}
                </svg>
              </span>
              <span className="mt-3 block text-xs uppercase tracking-wider font-medium text-gray-400">{channel.title}</span>
              <span className="mt-1 block text-sm font-semibold break-words">{channel.value}</span>
              <span className="mt-1.5 block text-xs text-gray-500 leading-relaxed">{channel.note}</span>
            </>
          );

          return channel.href ? (
            <a
              key={channel.title}
              href={channel.href}
              className="block bg-white rounded-2xl border border-gray-100 p-5 shadow-sm transition-colors hover:border-gray-200 hover:shadow"
            >
              {inner}
            </a>
          ) : (
            <div key={channel.title} className="block bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              {inner}
            </div>
          );
        })}
      </div>

      <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
        <h2 className="text-base font-semibold">Before you write</h2>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">Include these and we can sort things out in one reply:</p>
        <ul className="mt-3 space-y-1.5 text-sm text-gray-500 list-disc pl-5">
          <li>Your order number, or the email address you checked out with</li>
          <li>The product name and size you ordered</li>
          <li>For a return or a damaged pair: a photo of the item</li>
          <li>The best number to reach you on</li>
        </ul>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <a href="mailto:boatengkissibenjamin@gmail.com" className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800">
          Send us an email
        </a>
        <a href="tel:+233556600144" className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
          Call +233 556600144
        </a>
        <Link href="/faqs" className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
          Read the FAQ
        </Link>
      </div>
    </div>
  );
}
