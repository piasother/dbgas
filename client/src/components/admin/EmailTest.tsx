import { useState } from "react";
import { adminFetch } from "./api";

export function EmailTest() {
  const [to, setTo] = useState("accounts@drewbulle.co.zw");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const send = async () => {
    setBusy(true);
    setResult(null);
    try {
      const r: any = await adminFetch("POST", "/api/admin/test-email", { to });
      setResult({ ok: true, text: `Sent to ${r.to}. Check that inbox (and spam).` });
    } catch (err: any) {
      setResult({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-8 p-4 border rounded-lg bg-slate-50">
      <h3 className="text-lg font-semibold mb-1">Test website email</h3>
      <p className="text-sm text-gray-600 mb-3">
        The website emails you about new orders, payments, enquiries and bookings, and sends password-reset links.
        Send a test to check the email settings in cPanel are working.
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          type="email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm min-w-[260px]"
          aria-label="Send test email to"
        />
        <button type="button" onClick={send} disabled={busy} className="px-4 py-2 bg-primary text-white rounded-md text-sm disabled:opacity-60">
          {busy ? "Sending…" : "Send test email"}
        </button>
      </div>
      {result && (
        <div
          role="status"
          className={`mt-3 text-sm rounded-md px-3 py-2 border ${result.ok ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}
        >
          {result.ok ? "✓ " : "✗ "}
          {result.text}
        </div>
      )}
    </div>
  );
}
