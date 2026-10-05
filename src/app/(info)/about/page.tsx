import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "SneakerVault is an online sneaker store in Accra, Ghana. Shop curated pairs with secure Paystack card payments and nationwide delivery.",
  alternates: { canonical: "/about" },
};

const steps = [
  {
    title: "Pick your pair",
    body: "Browse the catalogue, choose your size and colour, and add as many pairs as you like to your cart. No account needed.",
  },
  {
    title: "Pay securely",
    body: "Checkout opens Paystack's secure payment page. Pay with your Visa, Mastercard or Verve card — we never see or store your card details.",
  },
  {
    title: "Delivery and receipt",
    body: "We process your order within 24 hours, deliver anywhere in Ghana for a flat GH₵ 25, and email your receipt straight away.",
  },
];

export default function AboutPage() {
  return (
    <div className="animate-fade-in">
      <p className="text-xs uppercase tracking-wider font-medium text-gray-400">Company</p>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">About SneakerVault</h1>
      <p className="mt-3 text-sm text-gray-500 leading-relaxed">
        SneakerVault is an online sneaker store based in Ablekuma, Accra. We sell a curated
        selection of sneakers for men and women — from everyday runners to the pairs everyone
        is asking for — and deliver them anywhere in Ghana.
      </p>

      <section className="mt-8">
        <h2 className="text-base font-semibold">What we do</h2>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
          We keep the online shopping experience simple: clear product photos, honest sizing
          with US, UK, EUR and CM conversions, live stock per size, and one flat delivery fee
          with no surprises at checkout. Every order is paid for by card through Paystack,
          one of Africa&apos;s largest payment processors, and confirmed by email.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-base font-semibold">How shopping with us works</h2>
        <div className="mt-3 space-y-3">
          {steps.map((step, i) => (
            <div key={step.title} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex gap-4">
              <div className="w-7 h-7 shrink-0 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center">
                {i + 1}
              </div>
              <div>
                <h3 className="text-sm font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-gray-500 leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-base font-semibold">Why shop here</h2>
        <ul className="mt-3 space-y-2 text-sm text-gray-500 leading-relaxed list-disc pl-5">
          <li>Nationwide delivery for a flat GH₵ 25, processed within 24 hours.</li>
          <li>Secure card payments handled entirely by Paystack.</li>
          <li>An email receipt for every order, plus updates until it ships.</li>
          <li>7-day returns on unworn pairs — see our delivery and returns policy.</li>
          <li>Real stock counts per size, so what you see is what we have.</li>
        </ul>
      </section>

      <section className="mt-8 bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
        <h2 className="text-base font-semibold">Get in touch</h2>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
          Questions about a pair, an order or a delivery? We aim to reply within one working day.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href="mailto:boatengkissibenjamin@gmail.com" className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800">
            Email us
          </a>
          <a href="tel:+233556600144" className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
            +233 556600144
          </a>
        </div>
        <p className="mt-3 text-xs text-gray-400">Ablekuma, Accra, Ghana</p>
      </section>

      <div className="mt-8">
        <Link href="/" className="inline-block rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800">
          Start shopping
        </Link>
      </div>
    </div>
  );
}
