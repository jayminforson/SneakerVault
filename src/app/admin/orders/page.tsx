"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Order {
  orderId: string;
  sneakerName: string;
  brand: string;
  color: string;
  size: string;
  quantity: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  notes?: string;
  totalAmount: number;
  currency: string;
  status: "PENDING" | "PAID" | "FULFILLED" | "CANCELLED";
  paymentChannel?: string;
  createdAt: string;
  date: string;
}

const STATUSES: Order["status"][] = ["PENDING", "PAID", "FULFILLED", "CANCELLED"];

const STATUS_STYLES: Record<Order["status"], string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  PAID: "bg-blue-50 text-blue-700 border-blue-200",
  FULFILLED: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | Order["status"]>("ALL");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("sv-admin");
    if (!token) { router.push("/admin"); return; }
    fetchOrders();
  }, [router]);

  const fetchOrders = async () => {
    const res = await fetch("/api/orders");
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  };

  const updateStatus = async (orderId: string, status: Order["status"]) => {
    setUpdating(orderId);
    const res = await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    });
    if (res.ok) {
      setOrders((prev) => prev.map((o) => (o.orderId === orderId ? { ...o, status } : o)));
    }
    setUpdating(null);
  };

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (filter !== "ALL" && o.status !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${o.orderId} ${o.customerName} ${o.customerEmail} ${o.sneakerName} ${o.brand}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [orders, filter, search]);

  const stats = useMemo(() => {
    const revenue = orders
      .filter((o) => o.status === "PAID" || o.status === "FULFILLED")
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === "PENDING").length,
      paid: orders.filter((o) => o.status === "PAID").length,
      fulfilled: orders.filter((o) => o.status === "FULFILLED").length,
      revenue,
    };
  }, [orders]);

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
            <div className="flex items-center gap-2.5">
              <img src="/logo-light.png" alt="SneakerVault" className="h-8 w-8 rounded-lg object-cover" />
              <h1 className="text-sm font-semibold text-gray-900">SneakerVault Admin</h1>
            </div>
          </div>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-900">
            Log out
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-6">
          <Link href="/admin/dashboard" className="py-3 text-sm text-gray-500 hover:text-gray-900 border-b-2 border-transparent transition-colors">
            Sneakers
          </Link>
          <span className="py-3 text-sm font-semibold text-gray-900 border-b-2 border-black">
            Orders
          </span>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Total orders</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Pending</p>
            <p className="text-2xl sm:text-3xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Fulfilled</p>
            <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1">{stats.paid + stats.fulfilled}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Revenue</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">GH₵ {stats.revenue.toFixed(2)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Search order ID, customer, product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-black focus:border-transparent transition-shadow bg-white"
          />
          <div className="flex gap-0.5 bg-white border border-gray-200 rounded-xl p-1 overflow-x-auto">
            {(["ALL", ...STATUSES] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap transition-all duration-200 ${
                  filter === s ? "bg-black text-white shadow-sm" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Orders list */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">📦</p>
            <p className="text-gray-400 mb-2">No orders {filter !== "ALL" ? `with status "${filter}"` : "yet"}.</p>
            <p className="text-xs text-gray-400">Orders appear here automatically when customers check out.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => (
              <div key={order.orderId} className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-shadow hover:shadow-sm">
                <button
                  onClick={() => setExpanded(expanded === order.orderId ? null : order.orderId)}
                  className="w-full text-left px-4 sm:px-6 py-4 flex items-center gap-4"
                >
                  {/* Status dot + product */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900 truncate">{order.brand} {order.sneakerName}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[order.status]}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      {order.orderId} · {order.customerName} · {order.date}
                    </p>
                  </div>
                  {/* Amount */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900">GH₵ {order.totalAmount?.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">Qty {order.quantity}</p>
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${expanded === order.orderId ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded details */}
                {expanded === order.orderId && (
                  <div className="border-t border-gray-100 px-4 sm:px-6 py-4 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Customer */}
                      <div>
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">👤 Customer</h3>
                        <div className="space-y-1 text-sm text-gray-700">
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-gray-500">{order.customerEmail}</p>
                          <p className="text-gray-500">{order.customerPhone}</p>
                          <p className="text-gray-500">📍 {order.deliveryAddress}</p>
                          {order.notes && <p className="text-gray-400 italic text-xs pt-1">"{order.notes}"</p>}
                        </div>
                      </div>
                      {/* Product + payment */}
                      <div>
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">👟 Item</h3>
                        <div className="space-y-1 text-sm text-gray-700">
                          <p>{order.brand} {order.sneakerName}</p>
                          <p className="text-gray-500">Size {order.size} · {order.color} · Qty {order.quantity}</p>
                          {order.paymentChannel && <p className="text-gray-500">💳 Paid via {order.paymentChannel}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Status management */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-400 font-medium mr-1">Update status:</span>
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => updateStatus(order.orderId, s)}
                          disabled={updating === order.orderId || order.status === s}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-200 disabled:opacity-40 ${
                            order.status === s
                              ? STATUS_STYLES[s]
                              : "border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900"
                          }`}
                        >
                          {updating === order.orderId ? "..." : s.charAt(0) + s.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
