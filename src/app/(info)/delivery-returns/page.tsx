import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Delivery & Returns",
  description:
    "Delivery fees and timelines across Ghana, plus our 7-day returns, exchanges and refund process at SneakerVault.",
  alternates: { canonical: "/delivery-returns" },
};

const deliverySections: { title: string; body: React.ReactNode }[] = [
  {
    title: "Delivery fee",
    body: <>A flat GH₵ 25 delivery fee applies to every order, anywhere in Ghana. It is shown in your cart and at checkout before you pay — there are no extra charges, and no tax is added.</>,
  },
  {
    title: "Processing time",
    body: <>We prepare and dispatch orders within 24 hours of your payment being confirmed. Orders placed on weekends or public holidays are processed the next working day.</>,
  },
  {
    title: "Delivery times",
    body: (
      <>
        Accra: 1–2 working days. Outside Accra: 3–5 working days. These are estimates given
        in good faith — occasional courier delays happen, and we will keep you updated if
        yours is affected.
      </>
    ),
  },
  {
    title: "How delivery works",
    body: (
      <>
        We will call or message you on the phone number you gave us to confirm the address
        and arrange a convenient time. Someone must be available to receive the parcel. If we
        cannot reach you after two attempts, the order is held and we contact you again —
        extra storage or re-delivery costs may apply if the delay is on our side.
      </>
    ),
  },
  {
    title: "Tracking your order",
    body: (
      <>
        You get an email receipt immediately after paying and another email when your order
        ships. Between those, reply to your receipt email or call +233 556600144 with your
        order number for a status update.
      </>
    ),
  },
];

const returnSections: { title: string; body: React.ReactNode }[] = [
  {
    title: "7-day returns",
    body: <>You can return an item within 7 days of delivery. It must be unworn, unwashed and undamaged, with its tags attached and in the original box.</>,
  },
  {
    title: "Proof of purchase",
    body: <>Every order has an email receipt from receipts@sneakervault.live. Quote the order number from that email when you contact us — that is your proof of purchase.</>,
  },
  {
    title: "How to start a return",
    body: (
      <>
        Email boatengkissibenjamin@gmail.com or call +233 556600144 with your order number and
        a photo of the pair. We will confirm whether the return is approved and give you the
        return address in Ablekuma, Accra. Items sent back without contacting us first may
        not be accepted.
      </>
    ),
  },
  {
    title: "Exchanges",
    body: <>Need a different size or colour? Tell us within the same 7-day window. Exchanges are subject to stock — if the pair you want is unavailable, we will refund you instead.</>,
  },
  {
    title: "Refunds",
    body: <>Once we receive and inspect the pair, refunds are issued to the original payment method. Banks and Paystack usually take 5–10 working days to show the money on your statement. Original delivery fees are not refunded unless the item was faulty or we sent the wrong pair.</>,
  },
  {
    title: "What cannot be returned",
    body: <>Pairs that have been worn outside, soiled, damaged by you, or are missing tags or packaging cannot be returned or exchanged, for hygiene reasons. Sale items follow the same rules as full-price items.</>,
  },
  {
    title: "Wrong or damaged item",
    body: <>If we sent the wrong size or the pair arrived damaged, contact us within 7 days of delivery with a photo. We will arrange a replacement or a full refund, including delivery, at no cost to you.</>,
  },
];

export default function DeliveryReturnsPage() {
  return (
    <div className="animate-fade-in">
      <p className="text-xs uppercase tracking-wider font-medium text-gray-400">Policies</p>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">Delivery &amp; Returns</h1>
      <p className="mt-3 text-sm text-gray-500 leading-relaxed">
        Everything you need to know about getting your order and what happens if it is not
        right. Last updated 5 October 2026.
      </p>

      <section className="mt-8">
        <h2 className="text-base font-semibold">Delivery</h2>
        <div className="mt-3 bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm space-y-5">
          {deliverySections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold">{section.title}</h3>
              <p className="mt-1 text-sm text-gray-500 leading-relaxed">{section.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-base font-semibold">Returns &amp; refunds</h2>
        <div className="mt-3 bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm space-y-5">
          {returnSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold">{section.title}</h3>
              <p className="mt-1 text-sm text-gray-500 leading-relaxed">{section.body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8 bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
        <h2 className="text-base font-semibold">Need to arrange a return?</h2>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
          Contact us within 7 days of delivery and we will walk you through it.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href="mailto:boatengkissibenjamin@gmail.com?subject=Return%20request" className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800">
            Email us
          </a>
          <a href="tel:+233556600144" className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
            +233 556600144
          </a>
        </div>
        <p className="mt-4 text-xs text-gray-400">
          Read our <Link href="/terms" className="underline hover:text-gray-500">terms of service</Link> and{" "}
          <Link href="/privacy" className="underline hover:text-gray-500">privacy policy</Link>.
        </p>
      </div>
    </div>
  );
}
