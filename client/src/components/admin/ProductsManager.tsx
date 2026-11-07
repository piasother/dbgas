import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { adminFetch, uploadImage, money } from "./api";

type Draft = {
  id?: number;
  name: string;
  description: string;
  price: string; // dollars
  category: "lpg" | "accessories";
  image: string;
  badge: string;
  stockQuantity: string;
  lowStockThreshold: string;
  sku: string;
  supplier: string;
};

const empty: Draft = {
  name: "",
  description: "",
  price: "",
  category: "lpg",
  image: "",
  badge: "",
  stockQuantity: "0",
  lowStockThreshold: "5",
  sku: "",
  supplier: "",
};

const fromProduct = (p: Product): Draft => ({
  id: p.id,
  name: p.name,
  description: p.description,
  price: (p.price / 100).toFixed(2),
  category: (p.category as Draft["category"]) || "lpg",
  image: p.image,
  badge: p.badge || "",
  stockQuantity: String(p.stockQuantity ?? 0),
  lowStockThreshold: String(p.lowStockThreshold ?? 5),
  sku: p.sku || "",
  supplier: p.supplier || "",
});

const input = "w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40";

export function ProductsManager({ products }: { products: Product[] }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["/api/admin/products"] });
    qc.invalidateQueries({ queryKey: ["/api/products"] });
    qc.invalidateQueries({ queryKey: ["/api/admin/stock-status"] });
  };

  const set = (k: keyof Draft) => (e: any) => setDraft((d) => (d ? { ...d, [k]: e.target.value } : d));

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    try {
      let image = draft.image;
      if (file) image = await uploadImage(file, "product", draft.name);
      const body = {
        name: draft.name,
        description: draft.description,
        price: Number(draft.price),
        priceInDollars: true,
        category: draft.category,
        image,
        badge: draft.badge || null,
        stockQuantity: Number(draft.stockQuantity || 0),
        lowStockThreshold: Number(draft.lowStockThreshold || 0),
        sku: draft.sku || null,
        supplier: draft.supplier || null,
      };
      if (draft.id) await adminFetch("PUT", `/api/admin/products/${draft.id}`, body);
      else await adminFetch("POST", "/api/admin/products", body);
      toast({ title: draft.id ? "Product updated" : "Product added", description: draft.name });
      setDraft(null);
      setFile(null);
      refresh();
    } catch (err: any) {
      toast({ title: "Could not save product", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p: Product) => {
    if (!window.confirm(`Delete "${p.name}"? Products with sales history are marked out of stock instead.`)) return;
    try {
      const r: any = await adminFetch("DELETE", `/api/admin/products/${p.id}`);
      toast({ title: r.deleted ? "Product deleted" : "Marked out of stock", description: r.message || p.name });
      refresh();
    } catch (err: any) {
      toast({ title: "Could not delete", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold">Product Management</h2>
        <button
          type="button"
          onClick={() => {
            setDraft({ ...empty });
            setFile(null);
          }}
          className="btn-primary px-4 py-2 rounded-lg font-semibold inline-flex items-center"
        >
          <i className="fas fa-plus mr-2"></i>Add Product
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              {["Product", "Category", "Price", "Stock", "Shop status", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={p.image} alt="" className="h-12 w-12 object-contain rounded bg-slate-50 border" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{p.name}</div>
                      {p.sku && <div className="text-xs text-gray-500">SKU {p.sku}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{p.category === "lpg" ? "LPG" : "Accessories"}</td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">{money(p.price)}</td>
                <td className="px-4 py-3 text-sm">
                  {p.stockQuantity}
                  {p.stockQuantity <= p.lowStockThreshold && <div className="text-xs text-red-600">Low stock</div>}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${p.inStock && p.stockQuantity > 0 ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"}`}>
                    {p.inStock && p.stockQuantity > 0 ? "On sale" : "Out of stock"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm whitespace-nowrap">
                  <button type="button" onClick={() => { setDraft(fromProduct(p)); setFile(null); }} className="text-primary hover:underline mr-4">
                    <i className="fas fa-edit mr-1"></i>Edit
                  </button>
                  <button type="button" onClick={() => remove(p)} className="text-red-600 hover:underline">
                    <i className="fas fa-trash mr-1"></i>Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {draft && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
          <form onSubmit={save} className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <h3 className="text-lg font-semibold">{draft.id ? `Edit ${draft.name}` : "Add a new product"}</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-gray-700">Name *</span>
                <input className={input} value={draft.name} onChange={set("name")} required minLength={2} placeholder="e.g. 48kg Cylinder Refill" />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-gray-700">Description *</span>
                <textarea className={input} rows={3} value={draft.description} onChange={set("description")} required minLength={2} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Price (USD) *</span>
                <input className={input} type="number" step="0.01" min="0" value={draft.price} onChange={set("price")} required placeholder="93.60" />
                <span className="text-xs text-gray-500">Retail LPG: 48kg × $1.95 = $93.60</span>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Category *</span>
                <select className={input} value={draft.category} onChange={set("category")}>
                  <option value="lpg">LPG (gas &amp; cylinders)</option>
                  <option value="accessories">Accessories</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Stock quantity</span>
                <input className={input} type="number" min="0" value={draft.stockQuantity} onChange={set("stockQuantity")} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Low-stock warning at</span>
                <input className={input} type="number" min="0" value={draft.lowStockThreshold} onChange={set("lowStockThreshold")} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Badge (optional)</span>
                <input className={input} value={draft.badge} onChange={set("badge")} maxLength={40} placeholder="e.g. Brand New" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">SKU (optional)</span>
                <input className={input} value={draft.sku} onChange={set("sku")} maxLength={60} />
              </label>
              <div className="sm:col-span-2">
                <span className="text-sm font-medium text-gray-700">Picture</span>
                <div className="flex items-center gap-4 mt-1">
                  {(file || draft.image) && (
                    <img
                      src={file ? URL.createObjectURL(file) : draft.image}
                      alt=""
                      className="h-20 w-20 object-contain rounded border bg-slate-50"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="text-sm"
                  />
                </div>
                <span className="text-xs text-gray-500">JPG, PNG or WEBP up to 5 MB. Leave empty to keep the current picture.</span>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setDraft(null)} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={busy} className="px-4 py-2 bg-primary text-white rounded-md hover:opacity-90 disabled:opacity-60">
                {busy ? "Saving..." : draft.id ? "Save changes" : "Add product"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
