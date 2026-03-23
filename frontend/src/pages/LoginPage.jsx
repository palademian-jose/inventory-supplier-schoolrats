import { useState } from "react";
import toast from "react-hot-toast";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const [form, setForm] = useState({ username: "admin", password: "password123" });
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      await login(form);
      toast.success("Login successful");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_45%,#e2e8f0_100%)] p-6">
      <div className="grid w-full max-w-6xl gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden rounded-[2rem] border border-white/80 bg-slate-900 px-8 py-10 text-white shadow-2xl xl:block">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-sky-200">SchoolRats</p>
          <h1 className="mt-6 max-w-xl text-5xl font-semibold tracking-tight">
            Inventory and supplier management without clutter.
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-7 text-slate-300">
            This academic prototype focuses on the operational basics your advisor expects:
            stock visibility, supplier relationships, purchasing flow, payments, and issue
            tracking.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-300">Core modules</p>
              <p className="mt-2 text-2xl font-semibold">10</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-300">Architecture</p>
              <p className="mt-2 text-2xl font-semibold">REST + MySQL</p>
            </div>
          </div>
        </section>

        <section className="card w-full max-w-xl justify-self-center p-8 md:p-10">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-600">
              Welcome Back
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              Sign in to the dashboard
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Use the seeded credentials below to access the prototype and show the full flow.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Username</label>
              <input
                className="input"
                value={form.username}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, username: event.target.value }))
                }
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, password: event.target.value }))
                }
              />
            </div>
            <button className="btn-primary w-full" disabled={loading} type="submit">
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <div className="card-muted mt-6 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Demo Access
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Accounts: <span className="font-semibold text-slate-800">admin</span>,{" "}
              <span className="font-semibold text-slate-800">staff</span>,{" "}
              <span className="font-semibold text-slate-800">member</span>
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Password: <span className="font-semibold text-slate-800">password123</span>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
