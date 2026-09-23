"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { convertSize } from "@/lib/size-conversion";

interface Color { name: string; hex: string; image: string; }
interface Size { size: string; available: boolean; stock: number; }
interface Sneaker {
  id: string; name: string; brand: string; description: string;
  price: number; originalPrice?: number; heroImage: string;
  colors: Color[]; sizes: Size[]; tags: string[];
}


function DetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sneaker, setSneaker] = useState<Sneaker | null>(null);
  const [selColor, setSelColor] = useState(0);
  const [selSize, setSelSize] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [sizeScale, setSizeScale] = useState<"US" | "EUR" | "UK" | "CM">("US");
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      fetch(`/api/sneakers?id=${id}`).then(r => r.json()).then(data => {
        if (data.id) {
          setSneaker(data);
          const first = data.sizes.findIndex((s: Size) => s.available);
          if (first >= 0) setSelSize(first);
        }
      });
    }
  }, [searchParams]);

  if (!sneaker) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    </div>
  );

  const color = sneaker.colors[selColor];
  const stock = selSize !== null ? sneaker.sizes[selSize].stock : 0;

  const getDisplaySize = (s: Size) => {
    const converted = convertSize(s.size, sizeScale);
    return converted ?? s.size.replace(/^(US|UK|EUR|EU|CM)\s*/i, "");
  };

  const handleBuy = () => {
    if (selSize === null) return;
    router.push(`/checkout?id=${sneaker.id}&color=${encodeURIComponent(color.name)}&size=${encodeURIComponent(sneaker.sizes[selSize].size)}&qty=${qty}`);
  };

  const discount = sneaker.originalPrice ? Math.round((1 - sneaker.price / sneaker.originalPrice) * 100) : 0;

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo-light.png" alt="SneakerVault" className="h-10 w-10 rounded-lg object-cover" />
            <span className="text-lg font-bold tracking-tight">SneakerVault</span>
          </Link>
          <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-900 transition-colors flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image */}
          <div className="animate-fade-in">
            <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden relative">
              {!imgLoaded && <div className="absolute inset-0 skeleton" />}
              <img
                key={color.image}
                src={color.image || sneaker.heroImage}
                alt={sneaker.name}
                className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
                onLoad={() => setImgLoaded(true)}
              />
              {discount > 0 && (
                <div className="absolute top-4 left-4 bg-black text-white text-xs font-semibold px-3 py-1 rounded-full">
                  {discount}% OFF
                </div>
              )}
            </div>
            {/* Color thumbnails */}
            {sneaker.colors.length > 1 && (
              <div className="flex gap-2 mt-4">
                {sneaker.colors.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => { setSelColor(i); setImgLoaded(false); }}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200 ${i === selColor ? "border-black shadow-md scale-105" : "border-transparent opacity-60 hover:opacity-100"}`}
                  >
                    <img src={c.image || sneaker.heroImage} alt={c.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-5 sm:space-y-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">{sneaker.brand}</p>
              <h1 className="text-2xl sm:text-3xl font-bold mt-1">{sneaker.name}</h1>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-bold">GH₵ {sneaker.price.toFixed(2)}</span>
              {sneaker.originalPrice && (
                <span className="text-gray-400 line-through text-lg">GH₵ {sneaker.originalPrice.toFixed(2)}</span>
              )}
            </div>

            <p className="text-sm text-gray-500 leading-relaxed">{sneaker.description}</p>

            {/* Tags */}
            {sneaker.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {sneaker.tags.map(tag => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">{tag}</span>
                ))}
              </div>
            )}

            {/* Color */}
            {sneaker.colors.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2 font-medium">{color.name || "Color"}</p>
                <div className="flex gap-2.5">
                  {sneaker.colors.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => { setSelColor(i); setImgLoaded(false); }}
                      className={`w-9 h-9 rounded-full border-2 transition-all duration-200 ${i === selColor ? "border-black scale-110 shadow-md" : "border-gray-200 hover:border-gray-400"}`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-400 font-medium">Size</p>
                <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                  {(["US", "EUR", "UK", "CM"] as const).map(scale => (
                    <button
                      key={scale}
                      onClick={() => setSizeScale(scale)}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-all duration-200 ${sizeScale === scale ? "bg-black text-white shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                    >
                      {scale}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {sneaker.sizes.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => s.available && setSelSize(i)}
                    disabled={!s.available}
                    className={`py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${!s.available ? "bg-gray-50 text-gray-300 cursor-not-allowed line-through" : i === selSize ? "bg-black text-white shadow-md scale-105" : "bg-gray-50 text-gray-900 hover:bg-gray-100 active:scale-95"}`}
                  >
                    {getDisplaySize(s)}
                  </button>
                ))}
              </div>
              {selSize !== null && sneaker.sizes[selSize].stock <= 5 && sneaker.sizes[selSize].stock > 0 && (
                <p className="text-xs text-orange-500 mt-2 font-medium animate-fade-in">Only {sneaker.sizes[selSize].stock} left in stock</p>
              )}
            </div>

            {/* Quantity */}
            <div>
              <p className="text-xs text-gray-400 mb-2 font-medium">Quantity</p>
              <div className="inline-flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  disabled={qty <= 1}
                  className="px-4 py-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 text-sm transition-colors disabled:opacity-30"
                >
                  −
                </button>
                <span className="px-5 py-2.5 text-sm font-semibold min-w-[48px] text-center border-x border-gray-200">{qty}</span>
                <button
                  onClick={() => setQty(Math.min(stock, qty + 1))}
                  disabled={qty >= stock}
                  className="px-4 py-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 text-sm transition-colors disabled:opacity-30"
                >
                  +
                </button>
              </div>
            </div>

            {/* Buy */}
            <button
              onClick={handleBuy}
              disabled={selSize === null}
              className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 btn-press ${selSize === null ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-black text-white hover:bg-gray-800 shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/15"}`}
            >
              {selSize === null ? "Select a size" : `Buy Now · GH₵ ${(sneaker.price * qty).toFixed(2)}`}
            </button>

            <div className="flex gap-4 sm:gap-6 text-xs text-gray-400 pt-1">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Free delivery
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                Pay with MoMo
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                Email receipt
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SneakerDetailPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>}><DetailContent /></Suspense>;
}
