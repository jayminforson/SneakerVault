import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How SneakerVault collects, uses and protects your personal information, and your rights under Ghana's Data Protection Act, 2012.",
  alternates: { canonical: "/privacy" },
};

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: "1. Who we are",
    body: (
      <>
        SneakerVault operates sneakervault.live from Ablekuma, Accra, Ghana. We are
        responsible for your personal information when you shop with us. Questions can be
        sent to boatengkissibenjamin@gmail.com.
      </>
    ),
  },
  {
    title: "2. Information we collect",
    body: (
      <>
        When you place an order we collect your full name, phone number, email address,
        delivery address, city and any delivery notes you choose to add, together with the
        items, sizes and quantities you ordered. We also keep the order value, payment
        reference and status for our records. You do not create an account, so we do not hold
        a password for you.
      </>
    ),
  },
  {
    title: "3. How we use it",
    body: (
      <>
        We use your details to process and deliver your order, send your receipt and shipping
        updates by email, answer your questions, handle returns and refunds, prevent fraud,
        and meet our accounting and legal obligations. We do not use your information for
        advertising and we do not sell it to anyone.
      </>
    ),
  },
  {
    title: "4. Payment details",
    body: (
      <>
        Card payments are made on Paystack&apos;s secure checkout. Your card number, expiry
        date and CVV are entered on Paystack&apos;s systems and are never sent to, stored by
        or visible to SneakerVault. We only receive the payment result, the amount, the
        payment reference and the card&apos;s brand and last four digits for reconciliation.
      </>
    ),
  },
  {
    title: "5. Cookies and local storage",
    body: (
      <>
        We do not run advertising or analytics cookies. We store your cart in your own
        browser&apos;s local storage (the key <code className="text-xs bg-gray-100 px-1 rounded">sneakervault.cart.v1</code>)
        so it survives a refresh; clearing your browser data removes it. Admin users get a
        session cookie (<code className="text-xs bg-gray-100 px-1 rounded">sv_session</code>) that keeps them signed in
        to the management area and is cleared when they leave it.
      </>
    ),
  },
  {
    title: "6. Who we share it with",
    body: (
      <>
        Only with the service providers that run our business, and only to do their job:
        Paystack for payments, Neon for our database, Vercel for hosting, and Resend for
        sending receipt and order emails. Product photographs are served from image CDNs
        operated by Unsplash and similar providers. Each of them processes information under
        its own privacy policy. We disclose information to authorities where the law requires
        it.
      </>
    ),
  },
  {
    title: "7. How long we keep it",
    body: (
      <>
        Order records are kept for as long as we need them for delivery, support, refunds and
        accounting — generally at least six years for financial records. Enquiries are kept
        only while we are dealing with them. You can ask us to delete information we are not
        required to keep.
      </>
    ),
  },
  {
    title: "8. Security",
    body: (
      <>
        The site is served over HTTPS. Card details never touch our servers, admin access is
        protected by a signed, httpOnly session cookie, and access to our systems is limited
        to the people who need it to run the store.
      </>
    ),
  },
  {
    title: "9. Your rights",
    body: (
      <>
        Under Ghana&apos;s Data Protection Act, 2012 (Act 843) you may ask what information
        we hold about you, request a correction or deletion, withdraw consent at any time, and
        complain to the Data Protection Commission of Ghana if you are unhappy with how we
        handle your information. Email us and we will respond.
      </>
    ),
  },
  {
    title: "10. Children",
    body: (
      <>
        Our store is aimed at adults. If you are under 18, please ask a parent or guardian to
        place the order for you.
      </>
    ),
  },
  {
    title: "11. Changes to this policy",
    body: (
      <>
        We may update this policy as our services change. Any updates will appear on this
        page with a revised date.
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div className="animate-fade-in">
      <p className="text-xs uppercase tracking-wider font-medium text-gray-400">Legal</p>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">Privacy Policy</h1>
      <p className="mt-3 text-sm text-gray-500 leading-relaxed">
        Last updated 5 October 2026. This policy explains what we collect when you shop at
        SneakerVault, why we collect it, and the choices you have.
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
        To access, correct or delete your information, email{" "}
        <a href="mailto:boatengkissibenjamin@gmail.com" className="underline hover:text-gray-900">
          boatengkissibenjamin@gmail.com
        </a>{" "}
        or call +233 556600144.
      </p>
    </div>
  );
}
