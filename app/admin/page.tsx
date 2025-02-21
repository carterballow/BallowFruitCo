"use client";

import { useEffect, useState } from "react";

type OrderItem = { fruit: string; quantity: string; unit: string };

type Order = {
  id: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  items: OrderItem[];
  message: string;
  status: "pending" | "done";
};

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending">("pending");

  const getPassword = () => sessionStorage.getItem("admin_pw") ?? "";

  const fetchOrders = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/orders", {
      headers: { "x-admin-password": getPassword() },
    });
    if (res.ok) {
      const data = await res.json();
      setOrders(data.orders);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const markDone = async (id: string) => {
    await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": getPassword(),
      },
      body: JSON.stringify({ id }),
    });
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "done" } : o))
    );
  };

  const displayed =
    filter === "pending" ? orders.filter((o) => o.status === "pending") : orders;

  const pendingCount = orders.filter((o) => o.status === "pending").length;

  return (
    <div className="px-4 py-10">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#ededed]">Orders</h1>
            <p className="text-sm text-[#6b7280]">
              {pendingCount} pending · {orders.length} total
            </p>
          </div>
          <div className="flex gap-2">
            {(["pending", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                  filter === f
                    ? "bg-[#FF6B00] text-black"
                    : "border border-[#FF6B00]/30 text-[#FF6B00] hover:bg-[#FF6B00]/10"
                }`}
              >
                {f === "pending" ? "Pending Only" : "All Orders"}
              </button>
            ))}
            <button
              onClick={fetchOrders}
              className="rounded-md border border-[#242424] px-4 py-2 text-sm text-[#6b7280] hover:text-[#ededed]"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Orders */}
        {loading ? (
          <p className="text-[#6b7280]">Loading orders...</p>
        ) : displayed.length === 0 ? (
          <div className="rounded-xl border border-[#FF6B00]/20 bg-[#141414] p-12 text-center">
            <p className="text-4xl">✅</p>
            <p className="mt-3 font-medium text-[#ededed]">
              {filter === "pending" ? "No pending orders!" : "No orders yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayed.map((order) => (
              <div
                key={order.id}
                className={`rounded-xl border bg-[#141414] p-5 transition-all ${
                  order.status === "done"
                    ? "border-[#242424] opacity-50"
                    : "border-[#FF6B00]/30"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  {/* Left: customer info */}
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[#ededed]">
                        {order.customer_name}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          order.status === "done"
                            ? "bg-[#39FF1422] text-[#39FF14]"
                            : "bg-[#FF6B0022] text-[#FF6B00]"
                        }`}
                      >
                        {order.status === "done" ? "Done" : "Pending"}
                      </span>
                    </div>
                    <p className="text-sm text-[#6b7280]">
                      {order.customer_email}
                      {order.customer_phone && ` · ${order.customer_phone}`}
                    </p>
                    <p className="text-xs text-[#4b5563]">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>

                  {/* Right: mark done */}
                  {order.status === "pending" && (
                    <button
                      onClick={() => markDone(order.id)}
                      className="rounded-md bg-[#39FF14] px-4 py-2 text-sm font-semibold text-black hover:bg-[#30d911]"
                    >
                      Mark Done ✓
                    </button>
                  )}
                </div>

                {/* Items */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {order.items?.map((item, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-[#FF6B00]/30 bg-[#1c1c1c] px-3 py-1 text-xs text-[#ededed]"
                    >
                      {item.quantity} {item.unit} {item.fruit}
                    </span>
                  ))}
                </div>

                {/* Message */}
                {order.message && (
                  <p className="mt-3 rounded-lg bg-[#1c1c1c] px-3 py-2 text-sm text-[#9ca3af]">
                    &quot;{order.message}&quot;
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
