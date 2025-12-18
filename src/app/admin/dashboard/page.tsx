"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type ClientRow = {
  id: string;
  name: string;
  slug: string;
  plan_id: string | null;
  current_sprint: number | null;
};

type PlanRow = {
  id: string;
  name: string;
};

type PlanTaskRow = {
  id: string;
  plan_id: string;
  sprint_number: number;
  title: string;
};

type TaskRow = {
  id: string;
  client_id: string;
  title: string;
  details?: string;
  status: string;
  sprint_key: string | null;
  alteration_count: number | null;
  admin_rejection_reason?: string | null;
  template_plan_task_id?: string | null;
  created_at: string;
};

function formatPct(n: number) {
  return `${Math.round(n)}%`;
}

function norm(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function Donut({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; value: number; color: string }>;
}) {
  const total = Math.max(1, items.reduce((acc, x) => acc + x.value, 0));
  const radius = 42;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  return (
    <div className="glass glow p-5">
      <h3 className="font-bold text-lg truncate mb-4">{title}</h3>
      <div className="flex items-center gap-5">
        <svg viewBox="0 0 120 120" className="w-32 h-32 flex-shrink-0">
          <circle cx="60" cy="60" r={radius} className="fill-none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" />
          {items.map((it) => {
            const pct = it.value / total;
            const dash = pct * circumference;
            const dashArray = `${dash} ${circumference - dash}`;
            const dashOffset = -offset;
            offset += dash;
            return (
              <circle
                key={it.label}
                cx="60"
                cy="60"
                r={radius}
                className="fill-none"
                stroke={it.color}
                strokeWidth="14"
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 60 60)"
                strokeLinecap="butt"
              />
            );
          })}
          <text x="60" y="56" textAnchor="middle" className="fill-[hsl(var(--primary))] text-[12px] font-bold">
            {total}
          </text>
          <text x="60" y="72" textAnchor="middle" className="fill-[rgba(255,255,255,0.65)] text-[8px]">
            tarefas
          </text>
        </svg>

        <div className="min-w-0 flex-1 space-y-2">
          {items.map((it) => (
            <div key={it.label} className="flex items-center justify-between gap-3 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: it.color }} />
                <span className="text-[rgba(255,255,255,0.72)] text-sm font-medium truncate">{it.label}</span>
              </div>
              <span className="text-[rgba(255,255,255,0.88)] text-sm font-bold tabular-nums whitespace-nowrap">
                {it.value} ({formatPct((it.value / total) * 100)})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [planTasks, setPlanTasks] = useState<PlanTaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerStatus, setDrawerStatus] = useState<"in_progress" | "rejected">("in_progress");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [
          { data: clientData, error: clientErr },
          { data: taskData, error: taskErr },
          { data: planData, error: planErr },
          { data: planTaskData, error: planTaskErr },
        ] = await Promise.all([
          supabase.from("clients").select("id,name,slug,plan_id,current_sprint").order("name", { ascending: true }),
          supabase
            .from("client_tasks")
            .select(
              "id,client_id,title,details,status,sprint_key,alteration_count,admin_rejection_reason,template_plan_task_id,created_at"
            )
            .order("created_at", { ascending: false }),
          supabase.from("plans").select("id,name").order("name", { ascending: true }),
          supabase.from("plan_tasks").select("id,plan_id,sprint_number,title"),
        ]);

        if (clientErr) throw new Error(clientErr.message);
        if (taskErr) throw new Error(taskErr.message);
        if (planErr) throw new Error(planErr.message);
        if (planTaskErr) throw new Error(planTaskErr.message);

        if (!mounted) return;
        setClients((clientData as ClientRow[]) || []);
        setTasks((taskData as TaskRow[]) || []);
        setPlans((planData as PlanRow[]) || []);
        setPlanTasks((planTaskData as PlanTaskRow[]) || []);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Erro desconhecido");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const plansById = new Map(plans.map((p) => [p.id, p] as const));
    const silverPlanId = plans.find((p) => norm(p.name) === "silver")?.id;
    const goldPlanId = plans.find((p) => norm(p.name) === "gold")?.id;
    const ifoodPlanId = plans.find((p) => norm(p.name) === "ifood")?.id;

    const templateSprintById = new Map(planTasks.map((t) => [t.id, Number(t.sprint_number)] as const));

    const templateSprintByPlanTitle = new Map<string, number>();
    for (const t of planTasks) {
      const key = `${t.plan_id}::${norm(t.title)}`;
      if (!templateSprintByPlanTitle.has(key)) {
        templateSprintByPlanTitle.set(key, Number(t.sprint_number));
      }
    }

    const totalClients = clients.length;
    const nonRejectedTasks = tasks.filter((t) => t.status !== "rejected");
    const totalTasks = nonRejectedTasks.length;

    const statusCounts = new Map<string, number>();
    let totalAlterations = 0;

    const alterationsByClient = new Map<string, number>();

    for (const t of tasks) {
      statusCounts.set(t.status, (statusCounts.get(t.status) || 0) + 1);

      const a = Number(t.alteration_count || 0);
      if (t.status !== "rejected") totalAlterations += a;
      alterationsByClient.set(t.client_id, (alterationsByClient.get(t.client_id) || 0) + a);
    }

    const clientsById = new Map(clients.map((c) => [c.id, c] as const));

    const clientSprintById = new Map(clients.map((c) => [c.id, Number(c.current_sprint ?? 0)] as const));
    const clientPlanById = new Map(clients.map((c) => [c.id, c.plan_id] as const));

    const keepNewestByTitle = (items: Array<{ id: string; title: string; status: string; created_at: string }>) => {
      const byKey = new Map<string, { id: string; title: string; status: string; created_at: string }>();
      for (const it of items) {
        const key = norm(it.title);
        const prev = byKey.get(key);
        if (!prev || new Date(it.created_at).getTime() > new Date(prev.created_at).getTime()) {
          byKey.set(key, it);
        }
      }
      return [...byKey.values()].sort((a, b) => a.title.localeCompare(b.title));
    };

    const documentByClient = new Map<string, Array<{ id: string; title: string; status: string }>>();
    const documentRaw = new Map<string, Array<{ id: string; title: string; status: string; created_at: string }>>();
    for (const t of tasks) {
      const clientPlanId = clientPlanById.get(t.client_id) || null;

      const inferredTemplateSprint = clientPlanId ? templateSprintByPlanTitle.get(`${clientPlanId}::${norm(t.title)}`) : undefined;
      const templateSprint = t.template_plan_task_id
        ? templateSprintById.get(t.template_plan_task_id)
        : inferredTemplateSprint;

      const clientSprint = clientSprintById.get(t.client_id);

      // Only treat as "documento" if we can map it to a template sprint (by id or title)
      if (typeof templateSprint !== "number") continue;
      if (typeof clientSprint === "number" && templateSprint !== clientSprint) continue;

      const arr = documentRaw.get(t.client_id) || [];
      arr.push({ id: t.id, title: t.title, status: t.status, created_at: t.created_at });
      documentRaw.set(t.client_id, arr);
    }
    for (const [clientId, items] of documentRaw.entries()) {
      documentByClient.set(
        clientId,
        keepNewestByTitle(items).map((x) => ({ id: x.id, title: x.title, status: x.status }))
      );
    }

    const optimizationByClient = new Map<string, Array<{ id: string; title: string; status: string }>>();
    const ligacaoByClient = new Map<string, Array<{ id: string; title: string; status: string }>>();
    const optimizationRaw = new Map<string, Array<{ id: string; title: string; status: string; created_at: string }>>();
    const ligacaoRaw = new Map<string, Array<{ id: string; title: string; status: string; created_at: string }>>();
    for (const t of tasks) {
      const titleN = norm(t.title);
      const isOptimization = titleN.includes("otimizacao") && titleN.includes("cardapio");
      const isLigacao = titleN.startsWith("ligacao") || titleN.includes("ligacao (");

      const clientPlanId = clientPlanById.get(t.client_id) || null;
      const inferredTemplateSprint = clientPlanId ? templateSprintByPlanTitle.get(`${clientPlanId}::${norm(t.title)}`) : undefined;
      const templateSprint = t.template_plan_task_id ? templateSprintById.get(t.template_plan_task_id) : inferredTemplateSprint;
      const clientSprint = clientSprintById.get(t.client_id);

      // For these categories, only restrict by sprint when we can map the task to a template sprint.
      if (typeof templateSprint === "number" && typeof clientSprint === "number" && templateSprint !== clientSprint) {
        continue;
      }

      if (isOptimization) {
        const arr = optimizationRaw.get(t.client_id) || [];
        arr.push({ id: t.id, title: t.title, status: t.status, created_at: t.created_at });
        optimizationRaw.set(t.client_id, arr);
      }

      if (isLigacao) {
        const arr = ligacaoRaw.get(t.client_id) || [];
        arr.push({ id: t.id, title: t.title, status: t.status, created_at: t.created_at });
        ligacaoRaw.set(t.client_id, arr);
      }
    }

    for (const [clientId, items] of optimizationRaw.entries()) {
      optimizationByClient.set(
        clientId,
        keepNewestByTitle(items).map((x) => ({ id: x.id, title: x.title, status: x.status }))
      );
    }
    for (const [clientId, items] of ligacaoRaw.entries()) {
      ligacaoByClient.set(
        clientId,
        keepNewestByTitle(items).map((x) => ({ id: x.id, title: x.title, status: x.status }))
      );
    }

    const documentClients = [...documentByClient.entries()]
      .map(([clientId, docs]) => {
        const c = clientsById.get(clientId);
        return {
          clientId,
          client: c?.name || clientId,
          slug: c?.slug || "",
          count: docs.length,
          docs,
        };
      })
      .sort((a, b) => b.count - a.count);

    const optimizationClients = [...optimizationByClient.entries()]
      .map(([clientId, items]) => {
        const c = clientsById.get(clientId);
        return {
          clientId,
          client: c?.name || clientId,
          slug: c?.slug || "",
          count: items.length,
          items,
        };
      })
      .sort((a, b) => b.count - a.count);

    const ligacaoClients = [...ligacaoByClient.entries()]
      .map(([clientId, items]) => {
        const c = clientsById.get(clientId);
        return {
          clientId,
          client: c?.name || clientId,
          slug: c?.slug || "",
          count: items.length,
          items,
        };
      })
      .sort((a, b) => b.count - a.count);

    const topAlterations = [...alterationsByClient.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([clientId, count]) => ({
        client: clientsById.get(clientId)?.name || clientId,
        slug: clientsById.get(clientId)?.slug || "",
        count,
      }));

    const silverSprintClients = clients
      .filter((c) => !!silverPlanId && c.plan_id === silverPlanId)
      .filter((c) => [0, 1, 2].includes(Number(c.current_sprint ?? -1)))
      .map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        sprint: Number(c.current_sprint ?? 0),
        planName: plansById.get(c.plan_id || "")?.name || "",
      }))
      .sort((a, b) => a.sprint - b.sprint || a.name.localeCompare(b.name));

    const goldSprintClients = clients
      .filter((c) => !!goldPlanId && c.plan_id === goldPlanId)
      .filter((c) => [0, 1, 2].includes(Number(c.current_sprint ?? -1)))
      .map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        sprint: Number(c.current_sprint ?? 0),
        planName: plansById.get(c.plan_id || "")?.name || "",
      }))
      .sort((a, b) => a.sprint - b.sprint || a.name.localeCompare(b.name));

    const ifoodSprintClients = clients
      .filter((c) => !!ifoodPlanId && c.plan_id === ifoodPlanId)
      .filter((c) => [0, 1, 2].includes(Number(c.current_sprint ?? -1)))
      .map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        sprint: Number(c.current_sprint ?? 0),
        planName: plansById.get(c.plan_id || "")?.name || "",
      }))
      .sort((a, b) => a.sprint - b.sprint || a.name.localeCompare(b.name));

    const statusOrder = ["suggested", "queued", "in_progress", "alteration", "done", "completed", "rejected"];
    const statusLabel: Record<string, string> = {
      suggested: "Em avaliação",
      queued: "Na fila",
      in_progress: "Em produção",
      alteration: "Alteração",
      done: "Entregue",
      completed: "Concluída",
      rejected: "Rejeitada",
    };

    const statusDonut = statusOrder
      .filter((s) => statusCounts.has(s))
      .map((s) => {
        const value = statusCounts.get(s) || 0;
        const color =
          s === "suggested"
            ? "#facc15"
            : s === "queued"
            ? "#fde047"
            : s === "in_progress"
            ? "#60a5fa"
            : s === "alteration"
            ? "#c084fc"
            : s === "done" || s === "completed"
            ? "#4ade80"
            : "#f87171";

        return { label: statusLabel[s] || s, value, color };
      });

    const avgAlterationsPerTask = totalTasks > 0 ? totalAlterations / totalTasks : 0;

    return {
      totalClients,
      totalTasks,
      totalAlterations,
      avgAlterationsPerTask,
      statusDonut,
      documentClients,
      optimizationClients,
      ligacaoClients,
      silverSprintClients,
      goldSprintClients,
      ifoodSprintClients,
      topAlterations,
    };
  }, [clients, tasks, plans, planTasks]);

  const clientsById = useMemo(() => new Map(clients.map((c) => [c.id, c] as const)), [clients]);

  const drawerTasks = useMemo(() => {
    return tasks
      .filter((t) => t.status === drawerStatus)
      .slice(0, 200);
  }, [tasks, drawerStatus]);

  const openDrawer = (status: "in_progress" | "rejected") => {
    setDrawerStatus(status);
    setDrawerOpen(true);
  };

  return (
    <div className="overflow-x-hidden">
      <main className="space-y-6">
        <div className="glass glow p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight truncate">
                Dashboard
              </h1>
              <p className="text-[rgba(255,255,255,0.72)] text-sm sm:text-base font-medium truncate">
                Visão geral: clientes, demandas, sprints e alterações
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Link
                href="/admin"
                className="btn-primary px-4 py-2 font-semibold"
              >
                ← Voltar
              </Link>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="btn-glass px-4 py-2 font-semibold"
              >
                Atualizar
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="glass glow p-10 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[hsl(var(--primary))]" />
            <p className="mt-4 text-[rgba(255,255,255,0.72)]">Carregando dados...</p>
          </div>
        ) : error ? (
          <div className="glass glow p-6">
            <p className="text-[rgba(255,255,255,0.88)] font-medium">Erro: {error}</p>
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="glass glow p-5">
                <p className="text-[rgba(255,255,255,0.65)] text-sm font-semibold">Clientes</p>
                <p className="text-4xl font-bold tabular-nums mt-2">{metrics.totalClients}</p>
                <p className="text-[rgba(255,255,255,0.55)] text-xs mt-2">Total cadastrados</p>
              </div>
              <div className="glass glow p-5">
                <p className="text-[rgba(255,255,255,0.65)] text-sm font-semibold">Demandas</p>
                <p className="text-4xl font-bold tabular-nums mt-2">{metrics.totalTasks}</p>
                <p className="text-[rgba(255,255,255,0.55)] text-xs mt-2">Total registradas</p>
              </div>
              <div className="glass glow p-5">
                <p className="text-[rgba(255,255,255,0.65)] text-sm font-semibold">Alterações</p>
                <p className="text-4xl font-bold tabular-nums mt-2">{metrics.totalAlterations}</p>
                <p className="text-[rgba(255,255,255,0.55)] text-xs mt-2">Somatório de todas as demandas</p>
              </div>
              <div className="glass glow p-5">
                <p className="text-[rgba(255,255,255,0.65)] text-sm font-semibold">Média alterações/demanda</p>
                <p className="text-4xl font-bold tabular-nums mt-2">{metrics.avgAlterationsPerTask.toFixed(2)}</p>
                <p className="text-[rgba(255,255,255,0.55)] text-xs mt-2">Quanto retrabalho em média</p>
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Donut title="Demandas por status" items={metrics.statusDonut} />

              <div className="glass glow p-5">
                <h3 className="font-bold text-lg truncate mb-4">Gaveta de demandas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => openDrawer("in_progress")}
                    className="btn-glass px-4 py-3 font-semibold text-left"
                  >
                    <div className="text-[rgba(255,255,255,0.72)] text-xs font-bold">Em produção</div>
                    <div className="mt-1 text-2xl font-bold tabular-nums">
                      {tasks.filter((t) => t.status === "in_progress").length}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => openDrawer("rejected")}
                    className="btn-glass px-4 py-3 font-semibold text-left"
                  >
                    <div className="text-[rgba(255,255,255,0.72)] text-xs font-bold">Rejeitadas</div>
                    <div className="mt-1 text-2xl font-bold tabular-nums">
                      {tasks.filter((t) => t.status === "rejected").length}
                    </div>
                  </button>
                </div>
                <p className="mt-3 text-[rgba(255,255,255,0.55)] text-xs">Abre uma lista com as demandas mais recentes nesses status.</p>
              </div>
            </section>

            <section className="glass glow overflow-hidden">
              <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)]">
                <h2 className="text-xl sm:text-2xl font-bold">Clientes Silver 🩶 — Sprints 0, 1 e 2 </h2>
              </div>
              <div className="p-6">
                {metrics.silverSprintClients.length === 0 ? (
                  <p className="text-[rgba(255,255,255,0.65)]">Nenhum cliente Silver encontrado nas sprints 0–2.</p>
                ) : (
                  <div className="space-y-2">
                    {metrics.silverSprintClients.map((c) => (
                      <div key={c.id} className="btn-glass p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{c.name}</div>
                          <div className="text-xs text-[rgba(255,255,255,0.65)] truncate">{c.slug}</div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="badge-warning text-xs font-bold px-2 py-1 rounded-full">S{c.sprint}</span>
                          <Link href={`/admin/clientes/${c.slug}`} className="btn-primary px-3 py-2 text-xs font-bold">
                            Abrir
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="glass glow overflow-hidden">
              <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)]">
                <h2 className="text-xl sm:text-2xl font-bold">Clientes Gold 💛— Sprints 0, 1 e 2</h2>
              </div>
              <div className="p-6">
                {metrics.goldSprintClients.length === 0 ? (
                  <p className="text-[rgba(255,255,255,0.65)]">Nenhum cliente Gold encontrado nas sprints 0–2.</p>
                ) : (
                  <div className="space-y-2">
                    {metrics.goldSprintClients.map((c) => (
                      <div key={c.id} className="btn-glass p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{c.name}</div>
                          <div className="text-xs text-[rgba(255,255,255,0.65)] truncate">{c.slug}</div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="badge-warning text-xs font-bold px-2 py-1 rounded-full">S{c.sprint}</span>
                          <Link href={`/admin/clientes/${c.slug}`} className="btn-primary px-3 py-2 text-xs font-bold">
                            Abrir
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="glass glow overflow-hidden">
              <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)]">
                <h2 className="text-xl sm:text-2xl font-bold">Clientes Ifood ❤️ — Sprints 0, 1 e 2</h2>
              </div>
              <div className="p-6">
                {metrics.ifoodSprintClients.length === 0 ? (
                  <p className="text-[rgba(255,255,255,0.65)]">Nenhum cliente Ifood encontrado nas sprints 0–2.</p>
                ) : (
                  <div className="space-y-2">
                    {metrics.ifoodSprintClients.map((c) => (
                      <div key={c.id} className="btn-glass p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{c.name}</div>
                          <div className="text-xs text-[rgba(255,255,255,0.65)] truncate">{c.slug}</div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="badge-warning text-xs font-bold px-2 py-1 rounded-full">S{c.sprint}</span>
                          <Link href={`/admin/clientes/${c.slug}`} className="btn-primary px-3 py-2 text-xs font-bold">
                            Abrir
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="glass glow overflow-hidden">
              <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)]">
                <h2 className="text-xl sm:text-2xl font-bold">Clientes com documentos</h2>
              </div>
              <div className="p-6">
                {metrics.documentClients.length === 0 ? (
                  <p className="text-[rgba(255,255,255,0.65)]">Nenhum documento encontrado ainda.</p>
                ) : (
                  <div className="space-y-3">
                    {metrics.documentClients.slice(0, 50).map((row) => (
                      <details key={row.clientId} className="btn-glass p-4">
                        <summary className="cursor-pointer select-none flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{row.client}</div>
                            <div className="text-xs text-[rgba(255,255,255,0.65)] truncate">{row.slug}</div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="badge-warning text-xs font-bold px-2 py-1 rounded-full">{row.count}</span>
                            {row.slug ? (
                              <Link
                                href={`/admin/clientes/${row.slug}`}
                                className="btn-primary px-3 py-2 text-xs font-bold"
                              >
                                Abrir
                              </Link>
                            ) : null}
                          </div>
                        </summary>

                        <div className="mt-3 space-y-2">
                          {row.docs.slice(0, 20).map((d) => (
                            <div key={d.id} className="flex items-center justify-between gap-3 min-w-0">
                              <div className="min-w-0">
                                <div className="text-sm font-medium truncate">{d.title}</div>
                                <div className="text-xs text-[rgba(255,255,255,0.55)]">Status: {d.status}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    ))}

                    {metrics.documentClients.length > 50 ? (
                      <p className="text-xs text-[rgba(255,255,255,0.55)]">
                        Mostrando 50 clientes. Total: {metrics.documentClients.length}.
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="glass glow overflow-hidden">
                <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)]">
                  <h2 className="text-xl sm:text-2xl font-bold">Clientes com Otimização</h2>
                </div>
                <div className="p-6">
                  {metrics.optimizationClients.length === 0 ? (
                    <p className="text-[rgba(255,255,255,0.65)]">Nenhuma demanda de otimização encontrada.</p>
                  ) : (
                    <div className="space-y-3">
                      {metrics.optimizationClients.slice(0, 10).map((row) => (
                        <details key={row.clientId} className="btn-glass p-4">
                          <summary className="cursor-pointer select-none flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-semibold truncate">{row.client}</div>
                              <div className="text-xs text-[rgba(255,255,255,0.65)] truncate">{row.slug}</div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="badge-warning text-xs font-bold px-2 py-1 rounded-full">{row.count}</span>
                              {row.slug ? (
                                <Link href={`/admin/clientes/${row.slug}`} className="btn-primary px-3 py-2 text-xs font-bold">
                                  Abrir
                                </Link>
                              ) : null}
                            </div>
                          </summary>
                          <div className="mt-3 space-y-2">
                            {row.items.slice(0, 12).map((d) => (
                              <div key={d.id} className="min-w-0">
                                <div className="text-sm font-medium truncate">{d.title}</div>
                                <div className="text-xs text-[rgba(255,255,255,0.55)]">Status: {d.status}</div>
                              </div>
                            ))}
                          </div>
                        </details>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="glass glow overflow-hidden">
                <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)]">
                  <h2 className="text-xl sm:text-2xl font-bold">Clientes com Ligação</h2>
                </div>
                <div className="p-6">
                  {metrics.ligacaoClients.length === 0 ? (
                    <p className="text-[rgba(255,255,255,0.65)]">Nenhuma demanda de ligação encontrada.</p>
                  ) : (
                    <div className="space-y-3">
                      {metrics.ligacaoClients.slice(0, 10).map((row) => (
                        <details key={row.clientId} className="btn-glass p-4">
                          <summary className="cursor-pointer select-none flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-semibold truncate">{row.client}</div>
                              <div className="text-xs text-[rgba(255,255,255,0.65)] truncate">{row.slug}</div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="badge-warning text-xs font-bold px-2 py-1 rounded-full">{row.count}</span>
                              {row.slug ? (
                                <Link href={`/admin/clientes/${row.slug}`} className="btn-primary px-3 py-2 text-xs font-bold">
                                  Abrir
                                </Link>
                              ) : null}
                            </div>
                          </summary>
                          <div className="mt-3 space-y-2">
                            {row.items.slice(0, 12).map((d) => (
                              <div key={d.id} className="min-w-0">
                                <div className="text-sm font-medium truncate">{d.title}</div>
                                <div className="text-xs text-[rgba(255,255,255,0.55)]">Status: {d.status}</div>
                              </div>
                            ))}
                          </div>
                        </details>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="glass glow overflow-hidden">
              <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)]">
                <h2 className="text-xl sm:text-2xl font-bold">Top clientes por alterações</h2>
              </div>
              <div className="p-6">
                {metrics.topAlterations.length === 0 ? (
                  <p className="text-[rgba(255,255,255,0.65)]">Sem alterações registradas ainda.</p>
                ) : (
                  <>
                    <div className="md:hidden space-y-3">
                      {metrics.topAlterations.map((row) => (
                        <div key={row.client} className="glass p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-semibold truncate">{row.client}</div>
                              <div className="mt-1 text-xs text-[rgba(255,255,255,0.65)]">Slug: {row.slug || "—"}</div>
                            </div>
                            <span className="badge-warning px-2 py-1 rounded-full text-xs font-bold tabular-nums whitespace-nowrap">{row.count}</span>
                          </div>
                          <div className="mt-3">
                            {row.slug ? (
                              <Link href={`/admin/clientes/${row.slug}`} className="btn-glass inline-flex items-center px-3 py-2 text-xs font-semibold">
                                Abrir
                              </Link>
                            ) : (
                              <span className="text-[rgba(255,255,255,0.55)] text-xs">—</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm min-w-[520px]">
                        <thead>
                          <tr className="border-b border-[rgba(255,255,255,0.08)]">
                            <th className="text-left p-3 text-[rgba(255,255,255,0.72)] font-semibold">Cliente</th>
                            <th className="text-left p-3 text-[rgba(255,255,255,0.72)] font-semibold">Alterações</th>
                            <th className="text-left p-3 text-[rgba(255,255,255,0.72)] font-semibold">Ação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {metrics.topAlterations.map((row) => (
                            <tr key={row.client} className="border-b border-[rgba(255,255,255,0.06)]">
                              <td className="p-3 text-[rgba(255,255,255,0.82)] font-medium truncate">{row.client}</td>
                              <td className="p-3 text-[rgba(255,255,255,0.88)] font-bold tabular-nums">{row.count}</td>
                              <td className="p-3">
                                {row.slug ? (
                                  <Link href={`/admin/clientes/${row.slug}`} className="btn-glass inline-flex items-center px-3 py-2 text-xs font-semibold">
                                    Abrir
                                  </Link>
                                ) : (
                                  <span className="text-[rgba(255,255,255,0.55)]">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </section>
          </>
        )}
      </main>

      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Fechar gaveta"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/55"
          />

          <aside className="absolute right-0 top-0 h-full w-full max-w-[560px] glass glow border-l border-[rgba(255,255,255,0.10)]">
            <div className="p-5 border-b border-[rgba(255,255,255,0.08)]">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold truncate">
                    {drawerStatus === "in_progress" ? "Em produção" : "Rejeitadas"}
                  </h2>
                  <p className="text-[rgba(255,255,255,0.65)] text-sm">
                    {drawerTasks.length} item(s) (máx. 200)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="btn-glass px-3 py-2 font-semibold"
                >
                  Fechar
                </button>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setDrawerStatus("in_progress")}
                  className={`btn-glass px-3 py-2 font-semibold ${drawerStatus === "in_progress" ? "ring-1 ring-[rgba(255,255,255,0.18)]" : ""}`}
                >
                  Em produção
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerStatus("rejected")}
                  className={`btn-glass px-3 py-2 font-semibold ${drawerStatus === "rejected" ? "ring-1 ring-[rgba(255,255,255,0.18)]" : ""}`}
                >
                  Rejeitadas
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto h-[calc(100vh-140px)]">
              {drawerTasks.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-[rgba(255,255,255,0.72)]">Nenhuma demanda nesse status.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {drawerTasks.map((t) => {
                    const c = clientsById.get(t.client_id);
                    return (
                      <div key={t.id} className="glass p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-bold truncate">{c?.name || t.client_id}</div>
                            <div className="mt-1 text-[rgba(255,255,255,0.80)] text-sm font-semibold">
                              {t.title}
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {t.sprint_key && (
                                <span className="btn-glass px-2 py-1 text-xs font-semibold">
                                  {t.sprint_key.replace("sprint-", "Sprint ")}
                                </span>
                              )}
                              <span className="text-[rgba(255,255,255,0.55)] text-xs">
                                {new Date(t.created_at).toLocaleDateString("pt-BR")}
                              </span>
                            </div>
                            {drawerStatus === "rejected" && t.admin_rejection_reason && (
                              <div className="mt-2 text-[rgba(255,255,255,0.72)] text-sm">
                                <span className="font-bold">Motivo:</span> {t.admin_rejection_reason}
                              </div>
                            )}
                          </div>

                          {c?.slug && (
                            <Link
                              href={`/admin/clientes/${c.slug}`}
                              className="btn-glass px-3 py-2 text-sm font-semibold whitespace-nowrap"
                            >
                              Gerenciar →
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
