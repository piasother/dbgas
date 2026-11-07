import { Fragment, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Order } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { adminFetch, money } from "./api";

const STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const statusColour: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-indigo-100 text-indigo-800",
  out_for_delivery: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const payColour: Record<string, string> = {
  paid: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-gray-200 text-gray-700",
};

function parseItems(order: Order): Array<{ name: string; qty: number; price: number }> {
  try {
    const raw = JSON.parse(order.items || "[]");
    return raw.map((i: any) => ({
      name: i.product?.name || i.name || "Item",
      qty: Number(i.quantity) || 1,
      price: Number(i.product?.price ?? i.price ?? 0),
    }));
  } catch {
    return [];
  }
}

const waLink = (phone?: string | null) => {
  if (!phone) return null;
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("0")) d = "263" + d.slice(1);
  return d.length >= 9 ? `https://wa.me/${d}` : null;
};

export function OrdersManager({ orders, isAdmin }: { orders: Order[]; isAdmin: boolean }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("open");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .filter((o) => {
        if (filter === "open" && ["delivered", "completed", "cancelled"].includes(o.status)) return false;
        if (filter !== "open" && filter !== "all" && o.status !== filter) return false;
        if (!q) return true;
        return [String(o.id), o.customerName, o.customerPhone, o.phoneNumber, o.email, o.deliveryAddress]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      });
  }, [orders, filter, search]);

  const update = async (order: Order, body: Record<string, unknown>, label: string) => {
    setSavingId(order.id);
    try {
      await adminFetch("PATCH", `/api/admin/orders/${order.id}/manage`, body);
      toast({ title: `Order #${order.id} updated`, description: label });
      qc.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/stock-status"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/products"] });
    } catch (err: any) {
      toast({ title: "Could not update order", description: err.message, variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  const openCount = orders.filter((o) => !["delivered", "completed", "cancelled"].includes(o.status)).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold">Order Management</h2>
          <p className="text-sm text-gray-600">{openCount} open order{openCount === 1 ? "" : "s"} · click a row to manage it</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, order #"
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            aria-label="Search orders"
          />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm" aria-label="Filter orders">
            <option value="open">Open orders</option>
            <option value="all">All orders</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="text-center text-gray-500 py-12 border rounded-lg">No orders match.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                {["Order", "Customer", "Total", "Payment", "Status", "Date"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {visible.map((o) => {
                const items = parseItems(o);
                const phone = o.customerPhone || o.phoneNumber;
                const wa = waLink(phone);
                const isOpen = open === o.id;
                const pay = o.paymentStatus || "pending";
                return (
                  <Fragment key={o.id}>
                    <tr className="cursor-pointer hover:bg-gray-50" onClick={() => setOpen(isOpen ? null : o.id)}>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        <i className={`fas fa-chevron-${isOpen ? "down" : "right"} text-gray-400 mr-2 text-xs`}></i>#{o.id}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">{o.customerName}</div>
                        <div className="text-xs text-gray-500">{phone}</div>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold">{money(o.total)}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-gray-600 mb-1 capitalize">{o.paymentMethod}</div>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${payColour[pay] || "bg-gray-100"}`}>{pay}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${statusColour[o.status] || "bg-gray-100"}`}>
                          {STATUSES.find((s) => s.value === o.status)?.label || o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{new Date(o.createdAt).toLocaleString()}</td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-slate-50">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="grid md:grid-cols-3 gap-6">
                            <div>
                              <h4 className="font-semibold mb-2">Items</h4>
                              <ul className="text-sm space-y-1">
                                {items.map((i, idx) => (
                                  <li key={idx}>
                                    {i.qty} × {i.name} <span className="text-gray-500">@ {money(i.price)}</span>
                                  </li>
                                ))}
                              </ul>
                              <div className="mt-2 font-semibold">Total {money(o.total)}</div>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Customer</h4>
                              <div className="text-sm space-y-1">
                                <div>{o.customerName}</div>
                                {phone && (
                                  <div>
                                    <a className="text-primary hover:underline" href={`tel:${phone}`}>{phone}</a>
                                    {wa && (
                                      <a className="ml-3 text-green-700 hover:underline" href={wa} target="_blank" rel="noopener noreferrer">
                                        <i className="fab fa-whatsapp mr-1"></i>WhatsApp
                                      </a>
                                    )}
                                  </div>
                                )}
                                {o.email && <div><a className="text-primary hover:underline" href={`mailto:${o.email}`}>{o.email}</a></div>}
                                {o.deliveryAddress && o.deliveryAddress !== "TBD" && <div className="text-gray-700">{o.deliveryAddress}</div>}
                                {o.paynowReference && <div className="text-xs text-gray-500">PayNow ref {o.paynowReference}</div>}
                              </div>
                            </div>
                            <div className="space-y-3">
                              <h4 className="font-semibold">Update</h4>
                              <label className="block text-sm">
                                <span className="text-gray-600">Order status</span>
                                <select
                                  className="mt-1 w-full border border-gray-300 rounded-md px-2 py-2"
                                  value={o.status}
                                  disabled={savingId === o.id}
                                  onChange={(e) =>
                                    update(o, { status: e.target.value }, `Status: ${STATUSES.find((s) => s.value === e.target.value)?.label}`)
                                  }
                                >
                                  {STATUSES.map((s) => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                  ))}
                                </select>
                              </label>
                              {pay !== "paid" && (o.paymentMethod !== "paynow" || isAdmin) && (
                                <button
                                  type="button"
                                  disabled={savingId === o.id}
                                  onClick={() => {
                                    if (window.confirm(`Confirm you have received ${money(o.total)} for order #${o.id}? Stock will be deducted.`)) {
                                      update(o, { paymentStatus: "paid", status: o.status === "pending" ? "confirmed" : o.status }, "Marked as paid");
                                    }
                                  }}
                                  className="w-full px-3 py-2 rounded-md bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-60"
                                >
                                  <i className="fas fa-check mr-2"></i>Mark as paid
                                </button>
                              )}
                              {pay !== "paid" && o.paymentMethod === "paynow" && !isAdmin && (
                                <p className="text-xs text-gray-500">PayNow payments are confirmed automatically.</p>
                              )}
                              <label className="block text-sm">
                                <span className="text-gray-600">Notes</span>
                                <textarea
                                  className="mt-1 w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                                  rows={2}
                                  defaultValue={o.deliveryNotes || ""}
                                  onBlur={(e) => {
                                    if ((o.deliveryNotes || "") !== e.target.value) update(o, { deliveryNotes: e.target.value }, "Notes saved");
                                  }}
                                  placeholder="e.g. Delivered 2pm, customer signed"
                                />
                              </label>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
