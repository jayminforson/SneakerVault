import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms and conditions that apply when you shop at SneakerVault — pricing, payment, delivery, returns and liability.",
  alternates: { canonical: "/terms" },
};

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: "1. About these terms",
    body: (
      <>
        These terms govern your use of sneakervault.live and every order you place with
        SneakerVault (&quot;we&quot;, &quot;us&quot;). By placing an order you confirm that you
        accept them. If you do not agree, please do not use the website.
      </>
    ),
  },
  {
    title: "2. Who we are",
    body: (
      <>
        SneakerVault is an online sneaker store operating from Ablekuma, Accra, Ghana. You can
        reach us at boatengkissibenjamin@gmail.com or on +233 556600144.
      </>
    ),
  },
  {
    title: "3. Products and pricing",
    body: (
      <>
        All prices are in Ghana cedis (GH₵) and include any applicable taxes. Product
        photographs, sizes, colours and stock levels are shown on each product page. Stock is
        live: an item can sell out between you adding it to your cart and completing payment,
        in which case we will contact you and refund you in full. We correct pricing errors
        as soon as we notice them and will cancel and refund any order affected by one.
      </>
    ),
  },
  {
    title: "4. Orders",
    body: (
      <>
        Your cart and checkout form are an offer to buy. A contract is formed when we send
        you an order confirmation email after Paystack confirms your payment. We may decline
        an order — for example if an item is out of stock, if we cannot deliver to your
        address or if payment fails — in which case you are not charged or are refunded in
        full. You can cancel an order before it is dispatched by contacting us.
      </>
    ),
  },
  {
    title: "5. Payment",
    body: (
      <>
        Payment is made online by card through Paystack. We accept Visa, Mastercard and Verve
        cards. Your card details are entered on Paystack&apos;s secure checkout and are never
        entered on, stored by or visible to SneakerVault. Payment must be completed before we
        dispatch your order. We do not offer cash on delivery.
      </>
    ),
  },
  {
    title: "6. Delivery",
    body: (
      <>
        We deliver anywhere in Ghana for a flat GH₵ 25 fee and process orders within 24
        hours. Estimated timelines and the areas we cover are set out in our{" "}
        <Link href="/delivery-returns" className="underline hover:text-gray-900">delivery and returns policy</Link>,
        which forms part of these terms.
      </>
    ),
  },
  {
    title: "7. Returns, exchanges and refunds",
    body: (
      <>
        You may return unworn items with their tags and original packaging within 7 days of
        delivery, and request an exchange subject to stock. Refunds are issued to the
        original payment method. The full conditions and timeframes are in our{" "}
        <Link href="/delivery-returns" className="underline hover:text-gray-900">delivery and returns policy</Link>.
      </>
    ),
  },
  {
    title: "8. Your responsibilities",
    body: (
      <>
        Provide accurate name, phone, email and delivery details so we can reach you and
        complete delivery. Inspect your order on arrival and tell us within 7 days if
        anything is wrong or damaged. Use the website only for lawful purposes and do not
        attempt to interfere with its operation or security.
      </>
    ),
  },
  {
    title: "9. Intellectual property",
    body: (
      <>
        All content on this website — including the SneakerVault name, logo, photographs,
        text and design — belongs to us or our suppliers and may not be copied or reused
        without our written permission.
      </>
    ),
  },
  {
    title: "10. Liability",
    body: (
      <>
        We provide the website and our products with reasonable care. To the extent the law
        allows, we are not liable for indirect or consequential losses, or for losses caused
        by events outside our reasonable control (such as courier delays). Nothing in these
        terms limits liability that cannot be limited under Ghanaian law, including liability
        for fraud or for personal injury caused by our negligence.
      </>
    ),
  },
  {
    title: "11. Changes to these terms",
    body: (
      <>
        We may update these terms from time to time. The version in force when you place an
        order is the one that applies to that order. Check this page occasionally for
        changes.
      </>
    ),
  },
  {
    title: "12. Governing law",
    body: (
      <>
        These terms are governed by the laws of Ghana, and the courts of Ghana have
        jurisdiction over any dispute arising from them or from your use of this website.
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <div className="animate-fade-in">
      <p className="text-xs uppercase tracking-wider font-medium text-gray-400">Legal</p>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">Terms of Service</h1>
      <p className="mt-3 text-sm text-gray-500 leading-relaxed">
        Last updated 5 October 2026. These terms apply to sneakervault.live and to every order
        placed with SneakerVault.
      </p>

      <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm space-y-6">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-sm font-semibold">{section.title}</h2>
            <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">{section.body}</p>
          </section>
        ))}
      </div>

      <p className="mt-6 text-sm text-gray-500">
        Questions about these terms?{" "}
        <a href="mailto:boatengkissibenjamin@gmail.com" className="underline hover:text-gray-900">
          Email us
        </a>{" "}
        or call +233 556600144.
      </p>
    </div>
  );
}
