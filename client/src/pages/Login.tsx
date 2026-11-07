import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function getReturnTo(): string {
  const value = new URLSearchParams(window.location.search).get("returnTo") || "/";
  return value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/login") ? value : "/";
}

async function postJson(url: string, body: unknown) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    throw new Error("The server took too long to respond. Please check your connection and try again.");
  } finally {
    clearTimeout(timer);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Something went wrong. Please try again.");
  return data;
}

export function Login() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [forgot, setForgot] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const finish = async (user: unknown) => {
    queryClient.setQueryData(["/api/auth/user"], user);
    await queryClient.invalidateQueries();
    // Full navigation so every page re-reads the logged-in state cleanly.
    window.location.href = getReturnTo();
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    setBusy(true);
    try {
      const user = await postJson("/api/auth/login", {
        email: form.get("email"),
        password: form.get("password"),
      });
      await finish(user);
    } catch (err: any) {
      setError(err.message);
      setBusy(false);
    }
  };

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    if (form.get("password") !== form.get("confirmPassword")) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const user = await postJson("/api/auth/register", {
        firstName: form.get("firstName") || undefined,
        lastName: form.get("lastName") || undefined,
        email: form.get("email"),
        password: form.get("password"),
      });
      await finish(user);
    } catch (err: any) {
      setError(err.message);
      setBusy(false);
    }
  };

  const handleForgot = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const res = await postJson("/api/auth/forgot-password", { email: form.get("email") });
      setNotice(res.message || "Check your email for a reset link.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (forgot) {
    return (
      <Layout>
        <PageHeader title="Reset Your Password" description="We'll email you a link to choose a new password" />
        <div className="container mx-auto px-4 pb-16">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Forgot password</CardTitle>
                <CardDescription>Enter the email address you registered with.</CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
                )}
                {notice ? (
                  <div role="status" className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">{notice}</div>
                ) : (
                  <form onSubmit={handleForgot} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="forgot-email">Email</Label>
                      <Input id="forgot-email" name="email" type="email" autoComplete="email" required />
                    </div>
                    <Button type="submit" className="w-full" disabled={busy}>
                      {busy ? "Sending..." : "Send reset link"}
                    </Button>
                  </form>
                )}
                <button
                  type="button"
                  className="mt-4 text-sm text-primary hover:underline"
                  onClick={() => { setForgot(false); setNotice(null); setError(null); }}
                >
                  ← Back to log in
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        title={tab === "login" ? "Log In" : "Create an Account"}
        description="Sign in to place orders, pay with PayNow and track your deliveries"
      />
      <div className="container mx-auto px-4 pb-16">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>DB Gas account</CardTitle>
              <CardDescription>Use your email address and password.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                value={tab}
                onValueChange={(v) => {
                  setTab(v as "login" | "register");
                  setError(null);
                }}
              >
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Log in</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>

                {error && (
                  <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input id="login-email" name="email" type="email" autoComplete="email" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input id="login-password" name="password" type="password" autoComplete="current-password" required />
                    </div>
                    <Button type="submit" className="w-full" disabled={busy}>
                      {busy ? "Logging in..." : "Log in"}
                    </Button>
                    <button
                      type="button"
                      className="w-full text-sm text-primary hover:underline"
                      onClick={() => { setForgot(true); setError(null); }}
                    >
                      Forgot your password?
                    </button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="reg-first">First name</Label>
                        <Input id="reg-first" name="firstName" autoComplete="given-name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-last">Last name</Label>
                        <Input id="reg-last" name="lastName" autoComplete="family-name" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Email</Label>
                      <Input id="reg-email" name="email" type="email" autoComplete="email" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Password</Label>
                      <Input id="reg-password" name="password" type="password" autoComplete="new-password" minLength={8} required />
                      <p className="text-xs text-gray-500">At least 8 characters.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-confirm">Confirm password</Label>
                      <Input id="reg-confirm" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required />
                    </div>
                    <Button type="submit" className="w-full" disabled={busy}>
                      {busy ? "Creating account..." : "Create account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
