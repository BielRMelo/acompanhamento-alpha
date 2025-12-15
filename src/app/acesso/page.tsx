"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import PublicBrandHeader from "@/components/PublicBrandHeader";

export default function AcessoPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const cleaned = code.trim();
    if (!cleaned) {
      toast.error("Informe o código de acesso");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/access/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: cleaned }),
      });

      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || "Código inválido");
      }

      router.push(`/c/${encodeURIComponent(cleaned)}`);
    } catch (err) {
      toast.error("Não foi possível acessar", {
        description: err instanceof Error ? err.message : "Erro desconhecido",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10 py-6 sm:py-10 space-y-6">
        <PublicBrandHeader />
        <div className="mx-auto w-full max-w-md">
          <div className="glass glow p-6 sm:p-8">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Acessar painel</h1>
              <p className="mt-2 text-sm text-[rgba(255,255,255,0.72)]">
                Digite o código de acesso que você recebeu.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Código de acesso</label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ex: Alakazan-Alpha136"
                  className="input-dark w-full px-4 py-3 focus:outline-none"
                  autoComplete="off"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 font-bold disabled:opacity-60"
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>

              <p className="text-xs text-[rgba(255,255,255,0.60)]">
                Este código é individual e deve ser compartilhado somente com você.
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
