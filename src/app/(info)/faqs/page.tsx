import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers about paying, delivery times, tracking, returns, sizing and stock at SneakerVault — Accra, Ghana.",
  alternates: { canonical: "/faqs" },
};

const faqs: { q: string; a: React.ReactNode }[] = [
  {
    q: "What payment methods do you accept?",
    a: "Card payments only — Visa, Mastercard and Verve — processed on Paystack's secure checkout. We never see or store your card number. Payment must be completed online before we dispatch your order.",
  },
  {
    q: "How much does delivery cost?",
    a: "A flat GH₵ 25 anywhere in Ghana, shown in your cart and at checkout before you pay. There are no other charges, and no tax is added.",
  },
  {
    q: "How long does delivery take?",
    a: (
      <>
        Orders are processed within 24 hours. Delivery in Accra usually takes 1–2 working days,
        and 3–5 working days elsewhere in Ghana. Full details are on our{" "}
        <Link href="/delivery-returns" className="underline hover:text-gray-900">delivery and returns page</Link>.
      </>
    ),
  },
  {
    q: "How do I know my order went through?",
    a: "You will see a confirmation on screen and receive an email receipt from receipts@sneakervault.live as soon as Paystack confirms the payment. We email you again when your order ships.",
  },
  {
    q: "Can I track my order?",
    a: "Reply to your receipt email, or call or WhatsApp us on +233 556600144 with your order number, and we will tell you exactly where your pair is.",
  },
  {
    q: "Can I return or exchange a pair?",
    a: (
      <>
        Yes. Unworn pairs with tags and original packaging can be returned within 7 days of
        delivery, and we can exchange for another size subject to stock. See the{" "}
        <Link href="/delivery-returns" className="underline hover:text-gray-900">full returns policy</Link>.
      </>
    ),
  },
  {
    q: "How do I know which size to order?",
    a: "Every product page has a size selector with US, UK, EU and CM conversions and live stock per size. If you are between sizes, message us on +233 556600144 before ordering and we will help you choose.",
  },
  {
    q: "Do I need an account to order?",
    a: "No. Add your pairs to the cart, check out as a guest, and we use your details only to deliver the order and send your receipt. Your cart is saved in your browser so you can come back to it later.",
  },
  {
    q: "Do you have a physical shop?",
    a: "We are online-only. Everything is ordered through this website and delivered to you — our office is in Ablekuma, Accra.",
  },
  {
    q: "Something is wrong with my order. What now?",
    a: (
      <>
        Contact us within 7 days of delivery at{" "}
        <a href="mailto:boatengkissibenjamin@gmail.com" className="underline hover:text-gray-900">boatengkissibenjamin@gmail.com</a>{" "}
        or on +233 556600144 with your order number and a photo, and we will arrange a
        replacement or refund.
      </>
    ),
  },
];

export default function FaqsPage() {
  return (
    <div className="animate-fade-in">
      <p className="text-xs uppercase tracking-wider font-medium text-gray-400">Help</p>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">Frequently asked questions</h1>
      <p className="mt-3 text-sm text-gray-500 leading-relaxed">
        Everything about paying, delivery, returns and sizing at SneakerVault. If your
        question is not here, email us or call +233 556600144.
      </p>

      <div className="mt-6 space-y-3">
        {faqs.map((faq) => (
          <details key={faq.q} className="group bg-white rounded-2xl border border-gray-100 shadow-sm">
            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden flex items-center justify-between gap-4 px-5 py-4 text-sm font-medium">
              {faq.q}
              <span className="text-gray-400 transition-transform duration-200 group-open:rotate-45 shrink-0 text-lg leading-none">+</span>
            </summary>
            <div className="px-5 pb-5 -mt-1 text-sm text-gray-500 leading-relaxed">{faq.a}</div>
          </details>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
        <h2 className="text-base font-semibold">Still need help?</h2>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
          Send us a message and we aim to reply within one working day.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href="mailto:boatengkissibenjamin@gmail.com" className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800">
            Email us
          </a>
          <Link href="/contact" className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
            All contact options
          </Link>
        </div>
      </div>
    </div>
  );
}
