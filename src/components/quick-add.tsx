"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CURRENCY_SYMBOL } from "@/lib/config";
import { useCart } from "@/components/cart-context";

interface Color { name: string; hex: string; image: string; }
interface Size { size: string; available: boolean; stock: number; }
interface Product {
  id: string; name: string; brand: string; price: number; heroImage: string;
  colors: Color[]; sizes: Size[];
}

// Summary the storefront card already has — everything else is fetched lazily
// when the modal opens, so the catalogue list payload stays small.
export interface QuickAddSeed {
  id: string; name: string; brand: string; price: number; heroImage: string;
}

type Load = { status: "loading" } | { status: "error" } | { status: "ready"; value: Product };

const stripUnit = (s: string) => s.replace(/^(US|UK|EUR|EU|CM)\s*/i, "");

export default function QuickAdd({ seed, onClose }: { seed: QuickAddSeed; onClose: () => void }) {
  const { add } = useCart();
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [sizeIdx, setSizeIdx] = useState<number | null>(null);
  const [colorIdx, setColorIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/sneakers?id=${encodeURIComponent(seed.id)}`);
        if (cancelled) return;
        if (res.status === 404 || !res.ok) { setLoad({ status: "error" }); return; }
        const data = await res.json();
        if (cancelled) return;
        if (!data?.id) { setLoad({ status: "error" }); return; }
        const first = data.sizes.findIndex((s: Size) => s.available);
        setSizeIdx(first >= 0 ? first : null);
        setColorIdx(0);
        setQty(1);
        setLoad({ status: "ready", value: data });
      } catch {
        if (!cancelled) setLoad({ status: "error" });
      }
    })();
    return () => { cancelled = true; };
  }, [seed.id]);

  // Escape closes; the modal is a dialog, so also trap the backdrop click.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const product = load.status === "ready" ? load.value : null;
  const size = product && sizeIdx !== null ? product.sizes[sizeIdx] : null;
  const canAdd = !!product && !!size && size.available && size.stock > 0;

  const submit = () => {
    if (!product || !size || added) return;
    const color = product.colors[colorIdx];
    add(
      {
        sneakerId: product.id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        image: color?.image || product.heroImage,
        size: size.size,
        color: color?.name || "",
        maxStock: size.stock,
      },
      qty
    );
    setAdded(true);
    window.setTimeout(onClose, 750);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Choose options for ${seed.name}`}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl border border-gray-100 shadow-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex gap-3 min-w-0">
            <div className="w-16 h-16 rounded-xl bg-gray-50 overflow-hidden shrink-0 relative">
              <Image src={seed.heroImage} alt={seed.name} fill sizes="64px" className="object-cover" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">{seed.brand}</p>
              <p className="text-sm font-medium truncate">{seed.name}</p>
              <p className="text-sm font-bold mt-0.5">{CURRENCY_SYMBOL} {seed.price.toFixed(2)}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-gray-300 hover:text-gray-600 transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {load.status === "loading" && (
          <div className="py-10 text-center">
            <div className="w-7 h-7 border-2 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-gray-400">Loading options...</p>
          </div>
        )}

        {load.status === "error" && (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-500">We couldn&apos;t load this product.</p>
            <button onClick={onClose} className="mt-3 text-xs text-black underline hover:no-underline">Close</button>
          </div>
        )}

        {product && (
          <div className="space-y-4">
            {product.colors.length > 1 && (
              <div>
                <p className="text-xs text-gray-400 mb-2 font-medium">Color — {product.colors[colorIdx]?.name}</p>
                <div className="flex gap-2.5">
                  {product.colors.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => setColorIdx(i)}
                      title={c.name}
                      className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${i === colorIdx ? "border-black scale-110 shadow-md" : "border-gray-200 hover:border-gray-400"}`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs text-gray-400 mb-2 font-medium">Size (US)</p>
              <div className="grid grid-cols-4 gap-2">
                {product.sizes.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setSizeIdx(i); setQty(1); }}
                    disabled={!s.available || s.stock < 1}
                    className={`py-2 rounded-xl text-sm font-medium transition-all duration-200 ${!s.available || s.stock < 1 ? "bg-gray-50 text-gray-300 cursor-not-allowed line-through" : i === sizeIdx ? "bg-black text-white shadow-md scale-105" : "bg-gray-50 text-gray-900 hover:bg-gray-100 active:scale-95"}`}
                  >
                    {stripUnit(s.size)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400 font-medium">Quantity</p>
              <div className="inline-flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  disabled={qty <= 1}
                  className="px-3.5 py-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 text-sm transition-colors disabled:opacity-30"
                >−</button>
                <span className="px-4 py-1.5 text-sm font-semibold min-w-[40px] text-center border-x border-gray-200">{qty}</span>
                <button
                  onClick={() => setQty(Math.min(size?.stock ?? 1, qty + 1))}
                  disabled={qty >= (size?.stock ?? 1)}
                  className="px-3.5 py-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 text-sm transition-colors disabled:opacity-30"
                >+</button>
              </div>
            </div>

            {size && size.stock <= 5 && size.stock > 0 && (
              <p className="text-xs text-orange-500 font-medium">Only {size.stock} left in stock</p>
            )}

            <button
              onClick={submit}
              disabled={!canAdd || added}
              className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 btn-press ${added ? "bg-green-600 text-white" : canAdd ? "bg-black text-white hover:bg-gray-800 shadow-lg shadow-black/10" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
            >
              {added ? "Added to cart ✓" : canAdd ? `Add to cart · ${CURRENCY_SYMBOL} ${(seed.price * qty).toFixed(2)}` : "Select a size"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
