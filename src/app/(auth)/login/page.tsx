"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ username: "admin", password: "password" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      await login(form);
      toast.success("Login successful");
      router.push("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-200 p-6">
      <div className="grid w-full max-w-6xl gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        {/* Branding panel */}
        <section className="hidden rounded-3xl border border-border/40 bg-slate-900 px-8 py-10 text-white shadow-2xl xl:block">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-sky-200">
            SchoolRats
          </p>
          <h1 className="mt-6 max-w-xl text-5xl font-semibold tracking-tight">
            Inventory and supplier management.
          </h1>

          <div className="mt-10 grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-300">Architecture</p>
              <p className="mt-2 text-2xl font-semibold">Next.js + MySQL</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-300">Subject Code</p>
              <p className="mt-2 text-2xl font-semibold">CSC481</p>
            </div>
          </div>
        </section>

        {/* Login form */}
        <Card className="w-full max-w-xl justify-self-center">
          <CardHeader className="space-y-1 pb-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Welcome Back
            </p>
            <CardTitle className="text-3xl tracking-tight">
              Sign in to the dashboard
            </CardTitle>
            <CardDescription>
              Enter your credentials to access the operations hub.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={form.username}
                  onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  autoComplete="current-password"
                />
              </div>
              <Button className="w-full" disabled={loading} type="submit">
                {loading ? "Signing in..." : "Login"}
              </Button>
            </form>

            <div className="mt-6 rounded-lg border bg-muted/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Demo Access
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Accounts:{" "}
                <span className="font-semibold text-foreground">admin</span>,{" "}
                <span className="font-semibold text-foreground">staff</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Password:{" "}
                <span className="font-semibold text-foreground">password</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
