"use client";

import Link from "next/link";
import Image from "next/image";
import { CURRENCY_SYMBOL, TAX_RATE, computeTotalsForLines } from "@/lib/config";
import SiteNav from "@/components/site-nav";
import { useCart, cartLineKey, CartItem } from "@/components/cart-context";

function LineRow({ item }: { item: CartItem }) {
  const { setQuantity, remove } = useCart();
  const key = cartLineKey(item);
  const lineTotal = item.price * item.quantity;

  return (
    <div className="flex gap-4 py-4 border-b border-gray-100 last:border-b-0">
      <Link
        href={`/sneaker?id=${encodeURIComponent(item.sneakerId)}`}
        className="w-20 h-20 shrink-0 rounded-xl bg-gray-50 overflow-hidden relative"
      >
        <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">{item.brand}</p>
            <Link
              href={`/sneaker?id=${encodeURIComponent(item.sneakerId)}`}
              className="text-sm font-medium truncate hover:underline block"
            >
              {item.name}
            </Link>
            <p className="text-xs text-gray-400 mt-0.5">
              Size {item.size}{item.color ? ` · ${item.color}` : ""}
            </p>
          </div>
          <p className="text-sm font-semibold shrink-0 tabular-nums">
            {CURRENCY_SYMBOL} {lineTotal.toFixed(2)}
          </p>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="inline-flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setQuantity(key, item.quantity - 1)}
              aria-label="Decrease quantity"
              className="px-3 py-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 text-sm transition-colors"
            >−</button>
            <span className="px-3.5 py-1.5 text-xs font-semibold min-w-[34px] text-center border-x border-gray-200 tabular-nums">
              {item.quantity}
            </span>
            <button
              onClick={() => setQuantity(key, item.quantity + 1)}
              disabled={item.quantity >= item.maxStock}
              aria-label="Increase quantity"
              className="px-3 py-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >+</button>
          </div>

          <button
            onClick={() => remove(key)}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Remove
          </button>
        </div>

        {item.quantity >= item.maxStock && (
          <p className="text-[11px] text-orange-500 mt-2">
            {item.maxStock} in stock — that&apos;s the most we can send.
          </p>
        )}
      </div>
    </div>
  );
}

export default function CartPage() {
  const { items, count, ready } = useCart();
  const totals = computeTotalsForLines(items.map((i) => ({ unitPrice: i.price, quantity: i.quantity })));

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteNav>
        <Link href="/" className="text-xs text-gray-400 hover:text-gray-900 transition-colors">Continue shopping</Link>
      </SiteNav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold tracking-tight">Your cart</h1>
        {ready && items.length > 0 && (
          <p className="text-sm text-gray-500 mt-1">
            {count} item{count === 1 ? "" : "s"}
          </p>
        )}

        <div className="mt-6">
          {!ready ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="h-20 skeleton rounded-xl" />
              <div className="h-20 skeleton rounded-xl mt-4" />
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <div className="text-4xl mb-3">🛒</div>
              <h2 className="text-lg font-semibold">Your cart is empty</h2>
              <p className="text-sm text-gray-500 mt-1">Find a pair you like and add it here.</p>
              <Link
                href="/"
                className="mt-5 inline-block rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
              >
                Browse the catalogue
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 px-5 shadow-sm">
                {items.map((item) => (
                  <LineRow key={cartLineKey(item)} item={item} />
                ))}
              </div>

              <div className="md:col-span-1">
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm sticky top-20 space-y-4">
                  <div className="border-b border-gray-100 pb-3 space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-gray-400">Subtotal</span><span className="tabular-nums">{CURRENCY_SYMBOL} {totals.subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Delivery</span><span className="tabular-nums">{CURRENCY_SYMBOL} {totals.deliveryFee.toFixed(2)}</span></div>
                    {TAX_RATE > 0 && (
                      <div className="flex justify-between"><span className="text-gray-400">Tax ({Math.round(TAX_RATE * 100)}%)</span><span className="tabular-nums">{CURRENCY_SYMBOL} {totals.tax.toFixed(2)}</span></div>
                    )}
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span>Total</span>
                    <span className="tabular-nums">{CURRENCY_SYMBOL} {totals.totalAmount.toFixed(2)}</span>
                  </div>

                  <Link
                    href="/checkout"
                    className="block w-full py-3.5 bg-black text-white rounded-xl text-sm font-semibold text-center hover:bg-gray-800 transition-all duration-200 btn-press shadow-lg shadow-black/10"
                  >
                    Proceed to checkout
                  </Link>
                  <p className="text-[11px] text-gray-400 text-center">Secure payment with Paystack. Receipt by email.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
