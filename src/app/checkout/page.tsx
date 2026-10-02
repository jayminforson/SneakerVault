"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { computeTotalsForLines, isValidQuantity, CURRENCY_SYMBOL, TAX_RATE, PAYMENT_METHODS, paymentMethodsSentence } from "@/lib/config";
import SiteNav from "@/components/site-nav";
import { useCart } from "@/components/cart-context";

interface Sneaker {
  id: string; name: string; brand: string; price: number; heroImage: string;
  colors: { name: string; image: string }[];
  sizes: { size: string; available: boolean; stock: number }[];
}
type Step = "info" | "pay" | "loading" | "done" | "error";

// A row the summary and the order request both render from. Single-product
// buy-now builds one; the cart builds as many as the customer added.
interface CheckoutLine {
  sneakerId: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
  maxStock: number;
}

function CheckoutContent() {
  const sp = useSearchParams();
  const id = sp.get("id");
  // null while the request for `id` is in flight. Storing the id alongside the
  // result means an id change never leaves the previous product on screen, and
  // `error` keeps a server failure distinct from a genuine 404.
  const [result, setResult] = useState<{ id: string; value: Sneaker | null; error: boolean } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [step, setStep] = useState<Step>("info");
  const [err, setErr] = useState("");
  const [stepKey, setStepKey] = useState(0);
  const paystackRef = useRef<string>("");
  const orderIdRef = useRef<string>("");
  const color = sp.get("color") || "";
  const size = sp.get("size") || "";
  const requestedQty = Number(sp.get("qty") ?? 1);
  const qty = isValidQuantity(requestedQty) ? requestedQty : 1;

  const { items: cartItems, ready: cartReady, clear: clearCart } = useCart();
  // Captured at settlement so the order summary still renders once the cart
  // has been emptied on success.
  const [paidLines, setPaidLines] = useState<CheckoutLine[]>([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/sneakers?id=${encodeURIComponent(id)}`);
        if (cancelled) return;
        if (res.status === 404) { setResult({ id, value: null, error: false }); return; }
        if (!res.ok) { setResult({ id, value: null, error: true }); return; }
        const data = await res.json();
        if (cancelled) return;
        setResult({ id, value: data?.id ? data : null, error: false });
      } catch {
        if (!cancelled) setResult({ id, value: null, error: true });
      }
    })();
    return () => { cancelled = true; };
  }, [id, reloadKey]);

  // Without `id` we are paying for the cart; with one, for a single pair
  // bought straight from the product page. Both paths produce the same list.
  let lines: CheckoutLine[];
  let stockWarning = "";

  if (!id) {
    if (!cartReady) return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
    if (paidLines.length > 0) {
      lines = paidLines;
    } else if (cartItems.length === 0) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Cart</p>
          <h1 className="mt-3 text-xl font-bold tracking-tight">Your cart is empty.</h1>
          <p className="mt-2 text-sm text-gray-500">Add a pair before heading to checkout.</p>
          <Link href="/" className="mt-5 inline-block rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800">
            Back to the store
          </Link>
        </div>
      );
    } else {
      lines = cartItems.map((i) => ({
        sneakerId: i.sneakerId,
        name: i.name,
        brand: i.brand,
        image: i.image,
        price: i.price,
        size: i.size,
        color: i.color,
        quantity: i.quantity,
        maxStock: i.maxStock,
      }));
      // Captured when the line was added, so it can go stale — the API
      // re-checks stock and returns 409 if something sold out meanwhile.
      const short = lines.find((l) => l.maxStock < 1 || l.quantity > l.maxStock);
      if (short) stockWarning = `${short.brand} ${short.name} (size ${short.size}) only has ${short.maxStock} left in stock.`;
    }
  } else {
    if (result === null || result.id !== id) return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );

    if (result.error) return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-red-400">Something went wrong</p>
        <h1 className="mt-3 text-xl font-bold tracking-tight">We couldn&apos;t load this product.</h1>
        <p className="mt-2 text-sm text-gray-500">Please check your connection and try again.</p>
        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={() => { setResult(null); setReloadKey((k) => k + 1); }}
            className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
          >
            Try again
          </button>
          <Link href="/" className="text-sm text-gray-400 transition-colors hover:text-gray-900">Back to the store</Link>
        </div>
      </div>
    );

    if (!result.value) return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-400">404</p>
        <h1 className="mt-3 text-xl font-bold tracking-tight">This pair isn&apos;t available.</h1>
        <p className="mt-2 text-sm text-gray-500">It may have sold out or been removed from the catalogue.</p>
        <Link href="/" className="mt-5 inline-block rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800">
          Back to the store
        </Link>
      </div>
    );

    const product = result.value;
    const colorObj = product.colors.find(c => c.name === color);
    const selectedSize = product.sizes.find(s => s.size === size);
    lines = [{
      sneakerId: product.id,
      name: product.name,
      brand: product.brand,
      image: colorObj?.image || product.heroImage,
      price: product.price,
      size,
      color,
      quantity: qty,
      maxStock: selectedSize ? (selectedSize.available ? selectedSize.stock : 0) : 0,
    }];
    if (selectedSize && (!selectedSize.available || selectedSize.stock < qty)) {
      stockWarning = `Size ${size} only has ${selectedSize.stock} left in stock. Go back and pick another size or quantity.`;
    }
  }

  // Display-only mirror of the server's pricing; the API recomputes these
  // from the catalogue price and never accepts client-supplied amounts.
  const { subtotal: sub, deliveryFee: delivery, tax, totalAmount: total } =
    computeTotalsForLines(lines.map((l) => ({ unitPrice: l.price, quantity: l.quantity })));
  const outOfStock = stockWarning !== "";
  const valid = name.trim() && email.trim() && phone.trim() && address.trim() && city.trim() && !outOfStock;

  const goToStep = (newStep: Step) => {
    setStepKey(k => k + 1);
    setStep(newStep);
  };

  const settle = async (reference: string) => {
    const verifyRes = await fetch(`/api/payment/verify?reference=${encodeURIComponent(reference)}`);
    const verifyData = await verifyRes.json().catch(() => ({}));
    if (!verifyRes.ok) throw new Error(verifyData.error || "Payment verification failed");
    if (verifyData.status !== "SUCCESSFUL") {
      throw new Error(verifyData.message || "Payment verification failed");
    }
    // Snapshot first, then empty the cart — the summary keeps rendering the
    // lines that were actually paid for.
    setPaidLines(lines);
    if (!id) clearCart();
    goToStep("done");
  };

  const pay = async () => {
    goToStep("loading");
    try {
      // 1. Create the order once, then reuse it across retries so a failed
      //    attempt never leaves a duplicate PENDING row behind.
      if (!orderIdRef.current) {
        const r1 = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: lines.map((l) => ({
              sneakerId: l.sneakerId, color: l.color, size: l.size, quantity: l.quantity,
            })),
            customerName: name, customerEmail: email, customerPhone: phone,
            deliveryAddress: `${address}, ${city}`, notes,
          }),
        });
        const o = await r1.json().catch(() => ({}));
        if (!r1.ok) throw new Error(o.error || "Could not start your order");
        orderIdRef.current = o.orderId;
      }

      // 2. Initialize Paystack. The server prices this from the stored order.
      const r2 = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, orderId: orderIdRef.current, customerName: name }),
      });
      const p = await r2.json().catch(() => ({}));

      if (r2.status === 409) {
        // The order was already paid — just re-confirm it instead of failing.
        const lookup = await fetch(`/api/orders?orderId=${encodeURIComponent(orderIdRef.current)}`);
        const body = await lookup.json().catch(() => ({}));
        const reference = body?.order?.paymentReference;
        if (reference) return await settle(reference);
        throw new Error(p.error || "This order has already been paid");
      }
      if (!r2.ok) throw new Error(p.error || "Could not start payment");

      paystackRef.current = p.reference;

      // 3. Open the Paystack popup
      const PaystackPop = (await import("@paystack/inline-js")).default;
      const popup = new PaystackPop();

      popup.resumeTransaction(p.accessCode, {
        onSuccess: async (response) => {
          goToStep("loading");
          try {
            await settle(response?.reference || paystackRef.current);
          } catch (e) {
            setErr(e instanceof Error ? e.message : "Payment verification failed");
            goToStep("error");
          }
        },
        onCancel: () => {
          setErr("Payment cancelled — you have not been charged.");
          goToStep("error");
        },
        onError: (e) => {
          setErr(e?.message || "Paystack could not be loaded. Please try again.");
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
      <SiteNav>
        {!id && (
          <Link href="/cart" className="text-xs text-gray-400 hover:text-gray-900 transition-colors">Edit cart</Link>
        )}
      </SiteNav>

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
                    <p className="text-xs text-gray-500 mb-4">Click below to open the secure Paystack checkout. You can pay with {paymentMethodsSentence()}.</p>
                    <div className="space-y-2.5 text-xs text-gray-500">
                      {PAYMENT_METHODS.map((method) => (
                        <p key={method.label} className="flex items-center gap-2"><span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-[10px]">✓</span> {method.label}</p>
                      ))}
                      <p className="flex items-center gap-2"><span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-[10px]">✓</span> Email receipt</p>
                    </div>
                  </div>
                  {stockWarning && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                      {stockWarning}
                    </p>
                  )}
                  <button onClick={pay} disabled={outOfStock} className="w-full py-3.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 btn-press shadow-lg shadow-black/10">
                    Pay {CURRENCY_SYMBOL} {total.toFixed(2)}
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
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {lines.map((l) => (
                  <div key={`${l.sneakerId}|${l.size}|${l.color}`} className="flex gap-3">
                    <Image src={l.image} alt="" width={64} height={64} className="w-16 h-16 rounded-xl object-cover bg-gray-50 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">{l.brand}</p>
                      <p className="text-sm font-medium truncate">{l.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {l.size}{l.color ? ` · ${l.color}` : ""} · ×{l.quantity}
                      </p>
                    </div>
                    <p className="text-xs font-semibold shrink-0 tabular-nums">
                      {CURRENCY_SYMBOL} {(l.price * l.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-gray-400">Subtotal</span><span className="tabular-nums">{CURRENCY_SYMBOL} {sub.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Delivery</span><span className="tabular-nums">{CURRENCY_SYMBOL} {delivery.toFixed(2)}</span></div>
                {TAX_RATE > 0 && (
                  <div className="flex justify-between"><span className="text-gray-400">Tax ({Math.round(TAX_RATE * 100)}%)</span><span className="tabular-nums">{CURRENCY_SYMBOL} {tax.toFixed(2)}</span></div>
                )}
                <div className="flex justify-between font-bold text-sm pt-2 border-t border-gray-100"><span>Total</span><span className="tabular-nums">{CURRENCY_SYMBOL} {total.toFixed(2)}</span></div>
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
