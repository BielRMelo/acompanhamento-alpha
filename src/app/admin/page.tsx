"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAllClients } from "@/hooks/useAllClients";
import { useAllTasks } from "@/hooks/useAllTasks";
import { usePlans } from "@/hooks/usePlans";
import { useClientPlan } from "@/hooks/useClientPlan";
import { supabase } from "@/lib/supabaseClient";

export default function AdminPage() {
  const { clients, loading: loadingClients, error: clientsError, refetch: refetchClients, updateClientPlan, updateClientSprint } = useAllClients();
  const { tasks, loading: loadingTasks, error: tasksError, refetch: refetchTasks, updateTaskStatus } = useAllTasks();
  const { plans, loading: loadingPlans, error: plansError } = usePlans();
  const { generateSprintTasks } = useClientPlan();
  const [generatingTasks, setGeneratingTasks] = useState<string | null>(null);
  const [clientSearch, setClientSearch] = useState("");

  void loadingPlans;
  void plansError;

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    await updateTaskStatus(taskId, newStatus);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "suggested":
        return "badge-warning";
      case "in_progress":
        return "badge-warning";
      case "completed":
      case "done":
        return "badge-success";
      case "rejected":
        return "badge-destructive";
      default:
        return "btn-glass";
    }
  };

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => {
      const name = (c.name || "").toLowerCase();
      const slug = (c.slug || "").toLowerCase();
      return name.includes(q) || slug.includes(q);
    });
  }, [clients, clientSearch]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "suggested":
        return "Sugerida";
      case "in_progress":
        return "Em Progresso";
      case "completed":
      case "done":
        return "Concluída";
      case "rejected":
        return "Rejeitada";
      default:
        return status;
    }
  };

  const getClientSlug = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return client?.slug ?? "-";
  };

  const getPlanName = (planId: string | null) => {
    if (!planId) return "-";
    const plan = plans.find((p) => p.id === planId);
    return plan?.name ?? "-";
  };

  const handlePlanChange = async (clientId: string, planId: string) => {
    try {
      await updateClientPlan(clientId, planId || null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSprintChange = async (clientId: string, sprint: number) => {
    try {
      await updateClientSprint(clientId, sprint);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateTasks = async (clientId: string, planId: string | null, currentSprint: number | null) => {
    if (!planId || currentSprint === null || currentSprint === undefined) {
      toast.error("Configure o plano e a sprint do cliente primeiro");
      return;
    }

    setGeneratingTasks(clientId);
    try {
      const result = await generateSprintTasks(clientId, planId, currentSprint);
      toast.success(result.message);
      await refetchTasks();
    } catch (err) {
      toast.error("Erro ao gerar tarefas", {
        description: err instanceof Error ? err.message : "Erro desconhecido",
      });
    } finally {
      setGeneratingTasks(null);
    }
  };

  return (
    <div className="min-h-screen">
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10 py-6 sm:py-8 space-y-8 overflow-x-hidden">
        {/* Header */}
        <div className="glass glow p-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 min-w-0">
            <div className="min-w-0">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 tracking-tight">
                Painel de Administrador
              </h1>
              <p className="text-sm sm:text-base lg:text-lg font-medium text-[rgba(255,255,255,0.72)]">
                Gerencie clientes e demandas do sistema
              </p>
            </div>
            <div className="flex gap-3 flex-wrap justify-start lg:justify-end">
              <Link
                href="/admin/dashboard"
                className="btn-glass px-4 sm:px-6 py-3 font-semibold"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/configuracoes"
                className="btn-glass px-4 sm:px-6 py-3 font-semibold"
              >
                Configurações
              </Link>
              <Link
                href="/"
                className="btn-primary px-4 sm:px-6 py-3 font-semibold"
              >
                Voltar
              </Link>
            </div>
          </div>
        </div>

        {/* Seção de Clientes */}
        <section className="glass glow overflow-hidden">
          <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)]">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-bold">Clientes</h2>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <div className="relative w-full sm:w-[320px]">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.55)]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </span>
                  <input
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="Pesquisar cliente ou código"
                    className="input-dark w-full pl-10 pr-3 py-2 text-sm focus:outline-none"
                    autoComplete="off"
                  />
                </div>
                <button onClick={refetchClients} className="btn-glass px-4 py-2 font-semibold whitespace-nowrap">
                  Atualizar
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {clientsError && (
              <div className="mb-4 p-4 btn-glass">
                <p className="font-medium">Erro: {clientsError.message}</p>
              </div>
            )}

            {loadingClients ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
                <p className="mt-4 text-[rgba(255,255,255,0.72)]">Carregando clientes...</p>
              </div>
            ) : (
              <>
                {/* Accordion list (mobile + desktop) */}
                <div className="space-y-3">
                  {filteredClients.length === 0 ? (
                    <div className="p-6 text-center">
                      <p className="text-[rgba(255,255,255,0.72)] text-base">Nenhum cliente encontrado.</p>
                    </div>
                  ) : (
                    filteredClients.map((client) => (
                      <details key={client.id} className="glass overflow-hidden">
                        <summary className="cursor-pointer select-none px-4 py-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-bold truncate">{client.name}</div>
                            <div className="mt-1">
                              <code className="inline-block max-w-full truncate btn-glass px-3 py-1.5 text-xs font-mono">
                                {client.slug}
                              </code>
                            </div>
                          </div>
                          <span className="text-[rgba(255,255,255,0.65)]">▾</span>
                        </summary>

                        <div className="p-4 border-t border-[rgba(255,255,255,0.08)] space-y-3">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <div>
                              <div className="text-xs text-[rgba(255,255,255,0.65)] font-bold mb-2">Plano</div>
                              <select
                                value={client.plan_id || ""}
                                onChange={(e) => handlePlanChange(client.id, e.target.value)}
                                className="input-dark w-full px-3 py-2 text-sm focus:outline-none cursor-pointer"
                              >
                                <option value="">Sem plano</option>
                                {plans.map((plan) => (
                                  <option key={plan.id} value={plan.id}>
                                    {plan.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <div className="text-xs text-[rgba(255,255,255,0.65)] font-bold mb-2">Sprint</div>
                              <select
                                value={client.current_sprint ?? 0}
                                onChange={(e) => handleSprintChange(client.id, Number(e.target.value))}
                                className="input-dark w-full px-3 py-2 text-sm focus:outline-none cursor-pointer"
                              >
                                {Array.from({ length: 16 }, (_, i) => i).map((num) => (
                                  <option key={num} value={num}>
                                    {num === 0 ? "Sprint 0 (Onboarding)" : `Sprint ${num}`}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleGenerateTasks(client.id, client.plan_id, client.current_sprint)}
                              disabled={generatingTasks === client.id || !client.plan_id}
                              className="btn-primary inline-flex items-center px-4 py-2 text-sm font-semibold whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {generatingTasks === client.id ? "Gerando..." : "🚀 Gerar Tarefas"}
                            </button>
                            <Link
                              href={`/admin/clientes/${client.slug}`}
                              className="btn-glass inline-flex items-center px-4 py-2 text-sm font-semibold whitespace-nowrap"
                            >
                              Gerenciar →
                            </Link>
                            <Link
                              href={`/c/${client.slug}`}
                              className="btn-glass inline-flex items-center px-4 py-2 text-sm font-semibold whitespace-nowrap"
                              target="_blank"
                            >
                              Ver Painel
                            </Link>
                            <button
                              type="button"
                              onClick={async () => {
                                const base = typeof window !== "undefined" ? window.location.origin : "";
                                const url = `${base}/c/${client.slug}`;
                                try {
                                  await navigator.clipboard.writeText(url);
                                  toast.success("Link copiado", { description: url });
                                } catch {
                                  toast.error("Não foi possível copiar o link", { description: url });
                                }
                              }}
                              className="btn-glass inline-flex items-center px-3 py-2 text-sm font-semibold whitespace-nowrap"
                              title="Copiar link do painel"
                            >
                              📋
                            </button>
                          </div>
                        </div>
                      </details>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Seção de Tarefas */}
        <section className="glass glow overflow-hidden">
          <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)]">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-bold">Todas as Demandas</h2>
              <button
                onClick={refetchTasks}
                className="btn-glass px-4 py-2 font-semibold"
              >
                Atualizar
              </button>
            </div>
          </div>

          <div className="p-6">
            {tasksError && (
              <div className="mb-4 p-4 btn-glass">
                <p className="font-medium">Erro: {tasksError.message}</p>
              </div>
            )}

            {loadingTasks ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
                <p className="mt-4 text-[rgba(255,255,255,0.72)]">Carregando tarefas...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4 opacity-80">📋</div>
                    <p className="text-[rgba(255,255,255,0.72)] text-lg font-medium">
                      Nenhuma demanda encontrada.
                    </p>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className="glass p-6 transition-all hover:glow"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4 min-w-0">
                        <div className="flex-1 min-w-0 sm:pr-4">
                          <h3 className="font-bold text-lg sm:text-xl mb-2 tracking-tight break-words">
                            {task.title}
                          </h3>
                          {task.details && (
                            <p className="text-[rgba(255,255,255,0.72)] leading-relaxed text-sm sm:text-base break-words">
                              {task.details}
                            </p>
                          )}
                        </div>
                        <span
                          className={`shrink-0 w-fit px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(
                            task.status
                          )}`}
                        >
                          {getStatusLabel(task.status)}
                        </span>
                      </div>

                      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 pt-4 border-t border-[rgba(255,255,255,0.08)] min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-yellow-400 min-w-0">
                          <span className="flex items-center gap-1">
                            <strong className="text-[rgba(255,255,255,0.72)]">Cliente:</strong>
                            <code className="btn-glass px-2 py-0.5 rounded text-xs font-mono">
                              {getClientSlug(task.client_id)}
                            </code>
                          </span>
                          <span className="flex items-center gap-1">
                            <strong className="text-[rgba(255,255,255,0.72)]">Data:</strong>
                            {new Date(task.created_at).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <div className="flex flex-col gap-2 w-full sm:w-64">
                          <select
                            value={task.status}
                            onChange={(e) =>
                              handleStatusChange(task.id, e.target.value)
                            }
                            className="input-dark px-4 py-2 font-medium focus:outline-none cursor-pointer"
                          >
                            <option value="suggested">Sugerida</option>
                            <option value="in_progress">Em Progresso</option>
                            <option value="completed">Concluída</option>
                            <option value="rejected">Rejeitada</option>
                          </select>
                          {task.status === "rejected" && (
                            <textarea
                              defaultValue={task.admin_rejection_reason || ""}
                              placeholder="Motivo da rejeição (visível para o cliente)"
                              onBlur={async (e) => {
                                await supabase
                                  .from("client_tasks")
                                  .update({ admin_rejection_reason: e.target.value })
                                  .eq("id", task.id);
                                await refetchTasks();
                              }}
                              className="input-dark w-full text-xs px-2 py-2 focus:outline-none resize-none"
                              rows={2}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
