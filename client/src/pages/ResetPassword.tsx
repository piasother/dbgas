import { useState, type FormEvent } from "react";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function ResetPassword() {
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [error, setError] = useState<string | null>(token ? null : "This reset link is incomplete. Please request a new one.");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    if (form.get("password") !== form.get("confirmPassword")) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, password: form.get("password") }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Could not reset your password.");
      setDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout>
      <PageHeader title="Choose a New Password" description="Set a new password for your DB Gas account" />
      <div className="container mx-auto px-4 pb-16">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>New password</CardTitle>
              <CardDescription>Use at least 8 characters.</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
              )}
              {done ? (
                <div className="space-y-4">
                  <div role="status" className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                    Your password has been changed and you're now logged in.
                  </div>
                  <Button className="w-full" onClick={() => (window.location.href = "/account")}>Go to my account</Button>
                </div>
              ) : (
                token && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New password</Label>
                      <Input id="new-password" name="password" type="password" autoComplete="new-password" minLength={8} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm new password</Label>
                      <Input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required />
                    </div>
                    <Button type="submit" className="w-full" disabled={busy}>
                      {busy ? "Saving..." : "Save new password"}
                    </Button>
                  </form>
                )
              )}
              {!done && (
                <a href="/login" className="mt-4 inline-block text-sm text-primary hover:underline">← Back to log in</a>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
