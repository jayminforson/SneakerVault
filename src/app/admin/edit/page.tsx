"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { parseSizeLabel, convertSize } from "@/lib/size-conversion";

interface Color { name: string; hex: string; image: string; }
interface Size { size: string; available: boolean; stock: number; }

type SizeScale = "US" | "UK" | "EUR" | "CM";

const SCALES: Record<SizeScale, { labels: string[]; placeholder: string }> = {
  US:  { labels: ["US 6", "US 7", "US 8", "US 9", "US 10", "US 11", "US 12"], placeholder: "9" },
  UK:  { labels: ["UK 5.5", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11"], placeholder: "8" },
  EUR: { labels: ["EUR 38.5", "EUR 40", "EUR 41", "EUR 42.5", "EUR 44", "EUR 45", "EUR 46.5"], placeholder: "42.5" },
  CM:  { labels: ["24 CM", "25 CM", "26 CM", "27 CM", "28 CM", "29 CM", "30 CM"], placeholder: "27" },
};

function EditForm() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const router = useRouter();
  const isEditing = !!editId;

  const [form, setForm] = useState({
    name: "", brand: "", description: "", price: "", originalPrice: "",
    heroImage: "", tags: "",
  });
  const [colors, setColors] = useState<Color[]>([{ name: "", hex: "#000000", image: "" }]);
  const [sizeScale, setSizeScale] = useState<SizeScale>("US");
  const [sizes, setSizes] = useState<Size[]>(
    SCALES.US.labels.map((label) => ({ size: label, available: true, stock: 10 }))
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);

  useEffect(() => {
    if (editId) {
      fetch(`/api/sneakers?id=${editId}`).then(r => r.json()).then(data => {
        setForm({
          name: data.name || "", brand: data.brand || "", description: data.description || "",
          price: String(data.price || ""), originalPrice: data.originalPrice ? String(data.originalPrice) : "",
          heroImage: data.heroImage || "", tags: (data.tags || []).join(", "),
        });
        if (data.colors?.length) setColors(data.colors);
        if (data.sizes?.length) {
          setSizes(data.sizes);
          const parsed = parseSizeLabel(data.sizes[0]?.size || "");
          if (parsed) setSizeScale(parsed.scale);
        }
      });
    }
  }, [editId]);

  const changeScale = (target: SizeScale) => {
    if (target === sizeScale) return;
    setSizes((prev) =>
      prev.map((s) => {
        const converted = convertSize(s.size, target);
        if (converted) {
          return { ...s, size: target === "CM" ? `${converted} CM` : `${target} ${converted}` };
        }
        // Not convertible (custom size) — keep as-is
        return s;
      })
    );
    setSizeScale(target);
  };

  const sizeMismatch = sizes.some((s) => {
    const parsed = parseSizeLabel(s.size);
    return !parsed || parsed.scale !== sizeScale;
  });

  const handleImageUpload = async (file: File, target: "hero" | number) => {
    const fd = new FormData();
    fd.append("file", file);
    if (typeof target === "number") setUploading(target);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (target === "hero") setForm(f => ({ ...f, heroImage: data.url }));
    else {
      const next = [...colors];
      next[target] = { ...next[target], image: data.url };
      setColors(next);
    }
    setUploading(null);
  };

  const handleSave = async () => {
    setSaving(true);
    const body = {
      id: editId || undefined,
      name: form.name, brand: form.brand, description: form.description,
      price: Number(form.price), originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      heroImage: form.heroImage,
      colors, sizes,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      rating: 4.5, reviewCount: 0,
    };
    const method = isEditing ? "PUT" : "POST";
    await fetch("/api/sneakers", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    router.push("/admin/dashboard");
  };

  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-900">&larr; Back</button>
          <div className="flex items-center gap-2.5"><img src="/logo-light.png" alt="SneakerVault" className="h-8 w-8 rounded-lg object-cover" /><h1 className="text-sm font-semibold text-gray-900">{isEditing ? "Edit" : "Add"} Sneaker</h1></div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Basic Info */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Basic Info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-xs text-gray-500 mb-1">Brand *</label><input className={inputCls} value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="Nike" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Name *</label><input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Air Max 90" /></div>
          </div>
          <div><label className="block text-xs text-gray-500 mb-1">Description</label><textarea className={inputCls + " resize-none"} rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short product description..." /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-xs text-gray-500 mb-1">Price (GH₵) *</label><input className={inputCls} type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="899.99" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Original Price (GH₵)</label><input className={inputCls} type="number" step="0.01" value={form.originalPrice} onChange={e => setForm(f => ({ ...f, originalPrice: e.target.value }))} placeholder="1099.99" /></div>
          </div>
          <div><label className="block text-xs text-gray-500 mb-1">Tags (comma separated)</label><input className={inputCls} value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="Popular, Running, Classic" /></div>
        </section>

        {/* Hero Image */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Main Image</h2>
          <div className="flex items-start gap-4">
            {form.heroImage && <img src={form.heroImage} alt="Hero" className="w-24 h-24 rounded-lg object-cover bg-gray-100" />}
            <label className="cursor-pointer">
              <span className="text-sm text-gray-600 hover:text-black underline">{form.heroImage ? "Change image" : "Upload image"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], "hero")} />
            </label>
          </div>
          <div><label className="block text-xs text-gray-500 mb-1">Or paste image URL</label><input className={inputCls} value={form.heroImage} onChange={e => setForm(f => ({ ...f, heroImage: e.target.value }))} placeholder="https://..." /></div>
        </section>

        {/* Colors */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Colors</h2>
            <button onClick={() => setColors([...colors, { name: "", hex: "#000000", image: "" }])} className="text-xs text-gray-600 hover:text-black underline">+ Add color</button>
          </div>
          {colors.map((c, i) => (
            <div key={i} className="flex items-center gap-3 flex-wrap">
              <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-black" value={c.name} onChange={e => { const n = [...colors]; n[i].name = e.target.value; setColors(n); }} placeholder="Color name" />
              <input type="color" value={c.hex} onChange={e => { const n = [...colors]; n[i].hex = e.target.value; setColors(n); }} className="w-9 h-9 rounded cursor-pointer border-0" />
              <label className="cursor-pointer text-xs text-gray-500 hover:text-black">
                {uploading === i ? "Uploading..." : "Upload"}
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], i)} />
              </label>
              {c.image && <img src={c.image} alt="" className="w-9 h-9 rounded object-cover" />}
              <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-black" value={c.image} onChange={e => { const n = [...colors]; n[i].image = e.target.value; setColors(n); }} placeholder="Image URL" />
              {colors.length > 1 && <button onClick={() => setColors(colors.filter((_, j) => j !== i))} className="text-xs text-red-500 hover:text-red-700">Remove</button>}
            </div>
          ))}
        </section>

        {/* Sizes */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Sizes & Stock</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Scale</span>
              <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5">
                {(Object.keys(SCALES) as SizeScale[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => changeScale(s)}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-all duration-200 ${sizeScale === s ? "bg-black text-white shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {sizeMismatch && (
            <div className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
              ⚠ Some sizes don't map cleanly to {sizeScale} — review the values below and edit if needed.
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {sizes.map((s, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
                  value={s.size}
                  onChange={(e) => { const n = [...sizes]; n[i].size = e.target.value; setSizes(n); }}
                  placeholder={SCALES[sizeScale].placeholder}
                />
                <input type="number" min="0" className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-black" value={s.stock} onChange={e => { const n = [...sizes]; n[i].stock = Number(e.target.value); setSizes(n); }} />
                <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                  <input type="checkbox" checked={s.available} onChange={e => { const n = [...sizes]; n[i].available = e.target.checked; setSizes(n); }} className="rounded" />
                  In stock
                </label>
              </div>
            ))}
          </div>
        </section>

        {/* Save */}
        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving || !form.name || !form.brand || !form.price} className="bg-black text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-40 transition-colors">
            {saving ? "Saving..." : isEditing ? "Save Changes" : "Add Sneaker"}
          </button>
          <button onClick={() => router.back()} className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-400 transition-colors">
            Cancel
          </button>
        </div>
      </main>
    </div>
  );
}

export default function AdminEditPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>}><EditForm /></Suspense>;
}
