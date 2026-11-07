import { useState, type FormEvent, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const BOOKING_SERVICES = [
  "LPG appliance / cylinder installation",
  "Bulk tank installation (commercial)",
  "Gas reticulation - university / laboratory",
  "Specialty gas lines (argon, nitrogen, compressed air)",
  "Safety audit / pressure test",
  "Other",
];

const input = "w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40";

/** A button that opens the installation booking form. */
export function BookInstallation({
  className,
  children,
  defaultService = BOOKING_SERVICES[0],
}: {
  className?: string;
  children: ReactNode;
  defaultService?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/installation-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(Object.fromEntries(f.entries())),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Could not send your booking.");
      setDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" className={className} onClick={() => { setOpen(true); setDone(false); setError(null); }}>
        {children}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Book an Installation</DialogTitle>
            <DialogDescription>Tell us what you need and we'll call you to confirm a date and quote.</DialogDescription>
          </DialogHeader>
          {done ? (
            <div className="space-y-4">
              <div role="status" className="rounded-md border border-green-200 bg-green-50 p-4 text-green-800">
                <strong>Thank you - your booking request has been sent.</strong>
                <p className="text-sm mt-1">Our team will contact you during business hours to confirm.</p>
              </div>
              <button type="button" className="btn-primary w-full py-2.5 rounded-lg font-semibold" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              {error && (
                <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
              )}
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Service *</span>
                <select name="service" className={input} defaultValue={defaultService} required>
                  {BOOKING_SERVICES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Your name *</span>
                  <input name="name" className={input} required minLength={2} autoComplete="name" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Phone / WhatsApp *</span>
                  <input name="phone" type="tel" className={input} required minLength={7} autoComplete="tel" placeholder="07..." />
                </label>
              </div>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Email</span>
                <input name="email" type="email" className={input} autoComplete="email" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Installation address *</span>
                <input name="address" className={input} required minLength={3} autoComplete="street-address" placeholder="Street, suburb, town" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Preferred date</span>
                <input name="preferredDate" type="date" min={today} className={input} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Details</span>
                <textarea
                  name="details"
                  rows={3}
                  className={input}
                  placeholder="e.g. 2 x 48kg cylinders to a restaurant kitchen; or lab with 6 outlets for argon and nitrogen"
                />
              </label>
              <button type="submit" disabled={busy} className="btn-primary w-full py-3 rounded-lg font-semibold disabled:opacity-60">
                {busy ? "Sending..." : "Send booking request"}
              </button>
              <p className="text-xs text-gray-500 text-center">
                Prefer to chat? WhatsApp <a className="underline" href="https://wa.me/263713314920" target="_blank" rel="noopener noreferrer">0713 314 920</a>
              </p>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
