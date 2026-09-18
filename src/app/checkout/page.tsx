"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Sneaker { id: string; name: string; brand: string; price: number; heroImage: string; colors: { name: string; image: string }[]; }
type Step = "info" | "pay" | "loading" | "done" | "error";

function CheckoutContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const [sneaker, setSneaker] = useState<Sneaker | null>(null);
  const [step, setStep] = useState<Step>("info");
  const [err, setErr] = useState("");
  const [stepKey, setStepKey] = useState(0);
  const paystackRef = useRef<string>("");
  const color = sp.get("color") || "";
  const size = sp.get("size") || "";
  const qty = parseInt(sp.get("qty") || "1");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const id = sp.get("id");
    if (id) fetch(`/api/sneakers?id=${id}`).then(r => r.json()).then(setSneaker);
  }, [sp]);

  if (!sneaker) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    </div>
  );

  const sub = sneaker.price * qty;
  const delivery = 25;
  const tax = sub * 0.15;
  const total = sub + delivery + tax;
  const valid = name.trim() && email.trim() && phone.trim() && address.trim() && city.trim();

  const colorObj = sneaker.colors.find(c => c.name === color);
  const img = colorObj?.image || sneaker.heroImage;

  const goToStep = (newStep: Step) => {
    setStepKey(k => k + 1);
    setStep(newStep);
  };

  const pay = async () => {
    goToStep("loading");
    try {
      // 1. Create the order
      const r1 = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sneakerId: sneaker.id, sneakerName: sneaker.name, brand: sneaker.brand,
          color, size, quantity: qty, customerName: name, customerEmail: email,
          customerPhone: phone, deliveryAddress: `${address}, ${city}`, notes,
          subtotal: sub, deliveryFee: delivery, tax, totalAmount: total, currency: "GHS",
        }),
      });
      const o = await r1.json();
      if (!r1.ok) throw new Error(o.error);

      // 2. Initialize Paystack transaction
      const r2 = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          amount: total,
          orderId: o.orderId,
          customerName: name,
        }),
      });
      const p = await r2.json();
      if (!r2.ok) throw new Error(p.error);

      paystackRef.current = p.reference;

      // 3. Open Paystack popup
      const PaystackPop = (await import("@paystack/inline-js")).default;
      const popup = new PaystackPop();

      popup.resumeTransaction(p.accessCode, {
        onSuccess: async () => {
          // 4. Verify the transaction
          try {
            const verifyRes = await fetch(`/api/payment/verify?reference=${encodeURIComponent(paystackRef.current)}`);
            const verifyData = await verifyRes.json();

            if (verifyData.status === "SUCCESSFUL") {
              // 5. Send email notifications
              await fetch("/api/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  orderId: o.orderId, customerName: name, customerEmail: email,
                  customerPhone: phone, sneakerName: sneaker.name, brand: sneaker.brand,
                  size, color, quantity: qty, subtotal: sub, deliveryFee: delivery,
                  tax, totalAmount: total, paymentMethod: verifyData.channel || "Paystack",
                  paymentStatus: "SUCCESSFUL", deliveryAddress: `${address}, ${city}`,
                  heroImage: sneaker.heroImage,
                }),
              });
              goToStep("done");
            } else {
              throw new Error("Payment verification failed");
            }
          } catch (e) {
            setErr(e instanceof Error ? e.message : "Payment verification failed");
            goToStep("error");
          }
        },
        onClose: () => {
          setErr("Payment was cancelled");
          goToStep("error");
        },
      });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
      goToStep("error");
    }
  };

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-black focus:border-transparent transition-shadow";

  const steps = [
    { label: "Info", num: 1 },
    { label: "Pay", num: 2 },
    { label: "Done", num: 3 },
  ];
  const currentStepIdx = step === "info" ? 0 : step === "pay" ? 1 : 2;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo-light.png" alt="SneakerVault" className="h-10 w-10 rounded-lg object-cover" />
            <span className="text-lg font-bold tracking-tight">SneakerVault</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Progress */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8">
          {steps.map((s, i) => {
            const active = currentStepIdx >= i;
            const current = currentStepIdx === i;
            return (
              <div key={i} className="flex items-center gap-1 sm:gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300 ${current ? "bg-black text-white scale-110 shadow-md" : active ? "bg-black text-white" : "bg-gray-200 text-gray-400"}`}>
                  {currentStepIdx > i ? "✓" : s.num}
                </div>
                <span className={`text-xs font-medium transition-colors ${active ? "text-gray-900" : "text-gray-400"}`}>{s.label}</span>
                {i < steps.length - 1 && <div className={`w-8 sm:w-12 h-px transition-colors duration-300 ${currentStepIdx > i ? "bg-black" : "bg-gray-200"}`} />}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="md:col-span-2">
            <div key={stepKey} className="animate-fade-in">
              {step === "info" && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
                    <h2 className="text-sm font-semibold mb-4">Delivery details</h2>
                    <div className="space-y-3">
                      <div><label className="text-xs text-gray-400 mb-1 block font-medium">Full name</label><input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Kwame Asante" /></div>
                      <div><label className="text-xs text-gray-400 mb-1 block font-medium">Email (for receipt)</label><input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="kwame@example.com" /></div>
                      <div><label className="text-xs text-gray-400 mb-1 block font-medium">Phone</label><div className="flex"><span className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-200 rounded-l-xl text-sm text-gray-400">+233</span><input className={inputCls + " rounded-l-none"} type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ""))} placeholder="24 123 4567" /></div></div>
                      <div><label className="text-xs text-gray-400 mb-1 block font-medium">Address</label><input className={inputCls} value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St, East Legon" /></div>
                      <div><label className="text-xs text-gray-400 mb-1 block font-medium">City</label><input className={inputCls} value={city} onChange={e => setCity(e.target.value)} placeholder="Accra" /></div>
                      <div><label className="text-xs text-gray-400 mb-1 block font-medium">Notes (optional)</label><textarea className={inputCls + " resize-none"} rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special requests..." /></div>
                    </div>
                  </div>
                  <button onClick={() => goToStep("pay")} disabled={!valid} className="w-full py-3.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 btn-press shadow-lg shadow-black/10">
                    Continue to payment
                  </button>
                </div>
              )}

              {step === "pay" && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
                    <h2 className="text-sm font-semibold mb-3">Payment</h2>
                    <p className="text-xs text-gray-500 mb-4">Click below to open the secure Paystack checkout. You can pay with <strong>MTN Mobile Money</strong>, <strong>card</strong>, or <strong>bank transfer</strong>.</p>
                    <div className="space-y-2.5 text-xs text-gray-500">
                      <p className="flex items-center gap-2"><span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-[10px]">✓</span> MTN Mobile Money</p>
                      <p className="flex items-center gap-2"><span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-[10px]">✓</span> Visa / Mastercard</p>
                      <p className="flex items-center gap-2"><span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-[10px]">✓</span> Bank Transfer</p>
                      <p className="flex items-center gap-2"><span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-[10px]">✓</span> Email receipt</p>
                    </div>
                  </div>
                  <button onClick={pay} className="w-full py-3.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all duration-200 btn-press shadow-lg shadow-black/10">
                    Pay GH₵ {total.toFixed(2)}
                  </button>
                  <button onClick={() => goToStep("info")} className="text-xs text-gray-400 hover:text-gray-900 transition-colors flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Edit details
                  </button>
                </div>
              )}

              {step === "loading" && (
                <div className="text-center py-16 sm:py-20">
                  <div className="w-12 h-12 border-2 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-5" />
                  <h2 className="text-lg font-semibold mb-2">Processing payment...</h2>
                  <p className="text-sm text-gray-500">Complete the payment in the checkout window</p>
                  <p className="text-xs text-gray-400 mt-2 animate-pulse-soft">Waiting for confirmation...</p>
                </div>
              )}

              {step === "done" && (
                <div className="text-center py-16 sm:py-20">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5 animate-scale-in">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h2 className="text-xl font-bold mb-2">Order confirmed!</h2>
                  <p className="text-sm text-gray-500 mb-1">Check your email for the receipt</p>
                  <p className="text-xs text-gray-400 mb-6">You&apos;ll also receive an email when your order ships</p>
                  <Link href="/" className="inline-flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors btn-press">
                    Continue shopping
                  </Link>
                </div>
              )}

              {step === "error" && (
                <div className="text-center py-16 sm:py-20">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </div>
                  <h2 className="text-lg font-semibold mb-2">Payment failed</h2>
                  <p className="text-sm text-red-500 mb-6">{err}</p>
                  <button onClick={() => goToStep("pay")} className="bg-black text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors btn-press">
                    Try again
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm sticky top-20 space-y-4">
              <div className="flex gap-3">
                <img src={img} alt="" className="w-16 h-16 rounded-xl object-cover bg-gray-50" />
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">{sneaker.brand}</p>
                  <p className="text-sm font-medium">{sneaker.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{size} · {color} · ×{qty}</p>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-gray-400">Subtotal</span><span>GH₵ {sub.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Delivery</span><span>GH₵ {delivery.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Tax (15%)</span><span>GH₵ {tax.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-sm pt-2 border-t border-gray-100"><span>Total</span><span>GH₵ {total.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>}><CheckoutContent /></Suspense>;
}
