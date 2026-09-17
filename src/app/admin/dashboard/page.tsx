"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Sneaker {
  id: string; name: string; brand: string; price: number;
  originalPrice?: number; heroImage: string; tags: string[];
}

export default function AdminDashboard() {
  const [sneakers, setSneakers] = useState<Sneaker[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("sv-admin");
    if (!token) { router.push("/admin"); return; }
    fetchSneakers();
  }, [router]);

  const fetchSneakers = async () => {
    const res = await fetch("/api/sneakers");
    const data = await res.json();
    setSneakers(data);
    setLoading(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await fetch(`/api/sneakers?id=${id}`, { method: "DELETE" });
    setSneakers(sneakers.filter((s) => s.id !== id));
  };

  const logout = () => {
    localStorage.removeItem("sv-admin");
    router.push("/admin");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              View Store
            </Link>
            <span className="text-gray-300">|</span>
            <div className="flex items-center gap-2.5"><img src="/logo.png" alt="SneakerVault" className="h-8 w-8 rounded-lg object-cover" /><h1 className="text-sm font-semibold text-gray-900">SneakerVault Admin</h1></div>
          </div>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-900">
            Log out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Sneakers</h2>
            <p className="text-sm text-gray-500 mt-0.5">{sneakers.length} products in your store</p>
          </div>
          <Link
            href="/admin/edit"
            className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            + Add Sneaker
          </Link>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : sneakers.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-4">No sneakers yet.</p>
            <Link href="/admin/edit" className="text-sm font-medium text-black underline hover:no-underline">
              Add your first sneaker
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Product</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 hidden sm:table-cell">Brand</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Price</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 hidden md:table-cell">Tags</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sneakers.map((sneaker) => (
                  <tr key={sneaker.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={sneaker.heroImage}
                          alt={sneaker.name}
                          className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                        />
                        <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                          {sneaker.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">{sneaker.brand}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">GH₵ {sneaker.price.toFixed(2)}</span>
                      {sneaker.originalPrice && (
                        <span className="text-xs text-gray-400 line-through ml-2">GH₵ {sneaker.originalPrice.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="flex gap-1 flex-wrap">
                        {sneaker.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/edit?id=${sneaker.id}`}
                          className="text-sm text-gray-600 hover:text-black underline transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(sneaker.id, sneaker.name)}
                          className="text-sm text-red-500 hover:text-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
