"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

function AdminLoginInner() {
  const router = useRouter();
  const params = useSearchParams();

  const nextUrl = useMemo(() => {
    const raw = params.get("next") || "/admin";
    if (!raw.startsWith("/admin")) return "/admin";
    return raw;
  }, [params]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, next: nextUrl }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as any;
        throw new Error(data?.message || "Falha no login");
      }

      toast.success("Bem-vindo", { description: "Acesso liberado." });
      router.replace(nextUrl);
    } catch (err) {
      toast.error("Não foi possível entrar", {
        description: err instanceof Error ? err.message : "Erro desconhecido",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10 py-10 sm:py-14">
        <div className="mx-auto w-full max-w-md">
          <div className="glass glow p-6 sm:p-8">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Acesso do Admin</h1>
              <p className="mt-2 text-sm text-[rgba(255,255,255,0.72)]">Entre com suas credenciais.</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="input-dark w-full px-4 py-3 focus:outline-none"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-dark w-full px-4 py-3 focus:outline-none"
                  required
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 font-bold disabled:opacity-60"
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[hsl(var(--primary))]" />
        </div>
      }
    >
      <AdminLoginInner />
    </Suspense>
  );
}
