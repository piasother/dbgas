import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { adminFetch } from "./api";

type Inquiry = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  inquiryType: string;
  message: string;
  status: string | null;
  createdAt: string;
};

const TYPE_LABEL: Record<string, string> = {
  installation: "Installation booking",
  residential: "Residential supply",
  commercial: "Commercial",
  wholesale: "Wholesale",
  reticulation: "Lab gas reticulation",
  emergency: "Emergency",
};

const waLink = (phone: string) => {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("0")) d = "263" + d.slice(1);
  return `https://wa.me/${d}`;
};

export function InquiriesManager() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("new");
  const { data: rows = [], isLoading } = useQuery<Inquiry[]>({ queryKey: ["/api/admin/inquiries"] });

  const visible = useMemo(
    () => rows.filter((r) => filter === "all" || (r.status || "new") === filter),
    [rows, filter],
  );

  const setStatus = async (r: Inquiry, status: string) => {
    try {
      await adminFetch("PATCH", `/api/admin/inquiries/${r.id}`, { status });
      qc.invalidateQueries({ queryKey: ["/api/admin/inquiries"] });
    } catch (err: any) {
      toast({ title: "Could not update", description: err.message, variant: "destructive" });
    }
  };

  const newCount = rows.filter((r) => (r.status || "new") === "new").length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold">Enquiries &amp; Bookings</h2>
          <p className="text-sm text-gray-600">{newCount} new · from the website contact form and installation bookings</p>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm" aria-label="Filter enquiries">
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="closed">Closed</option>
          <option value="all">All</option>
        </select>
      </div>
      {isLoading ? (
        <div className="text-gray-500">Loading…</div>
      ) : visible.length === 0 ? (
        <div className="text-center text-gray-500 py-12 border rounded-lg">Nothing here.</div>
      ) : (
        <div className="grid gap-4">
          {visible.map((r) => (
            <div key={r.id} className="border rounded-lg p-4 bg-white">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">
                    {r.name}
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 align-middle">
                      {TYPE_LABEL[r.inquiryType] || r.inquiryType}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    <a href={`tel:${r.phone}`} className="text-primary hover:underline">{r.phone}</a>
                    <a href={waLink(r.phone)} target="_blank" rel="noopener noreferrer" className="ml-3 text-green-700 hover:underline">
                      <i className="fab fa-whatsapp mr-1"></i>WhatsApp
                    </a>
                    {r.email && <a href={`mailto:${r.email}`} className="ml-3 text-primary hover:underline">{r.email}</a>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</span>
                  <select
                    value={r.status || "new"}
                    onChange={(e) => setStatus(r, e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                    aria-label={`Status for enquiry from ${r.name}`}
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
              <p className="text-sm text-gray-800 mt-3 whitespace-pre-wrap">{r.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
