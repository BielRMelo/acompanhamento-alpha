"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useClientBySlug } from "@/hooks/useClientBySlug";
import { useClientTasksBySprint } from "@/hooks/useClientTasksBySprint";
import { formatSprint } from "@/lib/utils";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

export default function ClientAdminPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { client, loading: loadingClient, error: clientError } = useClientBySlug(slug);

  const currentSprintNumber = (client as any)?.current_sprint ?? 0;
  const sprintKeyOverride = `sprint-${currentSprintNumber}`;
  const {
    backlogTasks,
    sprintTasks,
    loading: loadingTasks,
    error: tasksError,
    refetch,
    approveTask,
    updateTaskStatus,
    updateStepDone,
    deleteTask,
    currentSprint,
  } = useClientTasksBySprint(client?.id, sprintKeyOverride);

  const [showSummary, setShowSummary] = useState(false);

  // Agrupar tarefas da sprint por status
  const queuedSprint = sprintTasks.filter((t) => t.status === "queued");
  const inProgressSprint = sprintTasks.filter((t) => t.status === "in_progress" || t.status === "alteration");
  const doneSprint = sprintTasks.filter((t) => t.status === "done");

  const updateRejectionReason = async (taskId: string, reason: string) => {
    await supabase
      .from("client_tasks")
      .update({ admin_rejection_reason: reason })
      .eq("id", taskId);
    await refetch();
  };

  const updateCompletionLink = async (taskId: string, link: string) => {
    await supabase
      .from("client_tasks")
      .update({ admin_completion_link: link })
      .eq("id", taskId);
    await refetch();
  };

  const generateSummary = () => {
    const clientName = client?.name || "Cliente";
    const sprintFormatted = `Sprint ${currentSprintNumber}`;

    let summary = `CRONOGRAMA SEMANAL — ${clientName.toUpperCase()}\n`;
    summary += `${sprintFormatted}\n\n`;

    if (doneSprint.length > 0) {
      summary += "✔ Entregues:\n";
      doneSprint.forEach((task) => {
        summary += `• ${task.title}\n`;
      });
      summary += "\n";
    }

    if (inProgressSprint.length > 0) {
      summary += "🔄 Em produção:\n";
      inProgressSprint.forEach((task) => {
        summary += `• ${task.title}\n`;
      });
      summary += "\n";
    }

    if (queuedSprint.length > 0) {
      summary += "⏳ Aprovadas / na fila:\n";
      queuedSprint.forEach((task) => {
        summary += `• ${task.title}\n`;
      });
      summary += "\n";
    }

    summary += "Qualquer ajuste é só me chamar aqui. 👍";

    return summary;
  };

  const copyToClipboard = () => {
    const summary = generateSummary();
    navigator.clipboard.writeText(summary);
    toast.success("Resumo copiado", { description: "Cole no WhatsApp/E-mail do cliente" });
  };

  if (loadingClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-[hsl(var(--primary))] mb-4"></div>
          <p className="text-[rgba(255,255,255,0.72)] text-lg font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (clientError || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass glow p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Cliente não encontrado</h2>
          <Link
            href="/admin"
            className="mt-4 inline-block btn-primary px-6 py-3 font-semibold"
          >
            Voltar para Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10 py-6 sm:py-8 space-y-8">
        {/* Header */}
        <div className="glass glow p-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 min-w-0">
            <div className="min-w-0">
              <nav className="text-sm text-[rgba(255,255,255,0.65)] mb-2 truncate">
                <Link href="/admin" className="hover:opacity-90">
                  Clientes
                </Link>
                {" > "}
                <span className="text-[hsl(var(--primary))] font-semibold">{client.name}</span>
              </nav>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight break-words">
                Demandas - {client.name}
              </h1>
              <p className="mt-2 text-sm sm:text-base text-[rgba(255,255,255,0.72)]">
                Sprint atual: <span className="font-semibold">{currentSprintNumber === 0 ? "Sprint 0" : `Sprint ${currentSprintNumber}`}</span>
                {currentSprint ? (
                  <span className="ml-2 text-[rgba(255,255,255,0.55)]">({formatSprint(currentSprint)})</span>
                ) : null}
              </p>
            </div>
            <Link
              href="/admin"
              className="btn-primary px-4 sm:px-6 py-3 font-semibold w-full sm:w-auto text-center"
            >
              ← Voltar
            </Link>
          </div>
        </div>

        {/* Backlog */}
        <section className="glass glow overflow-hidden">
          <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)]">
            <h2 className="text-xl sm:text-2xl font-bold">Backlog</h2>
          </div>
          <div className="p-6">
            {loadingTasks ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[hsl(var(--primary))]"></div>
              </div>
            ) : backlogTasks.length === 0 ? (
              <p className="text-[rgba(255,255,255,0.72)] text-center py-8">Nenhuma tarefa em avaliação.</p>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                  {backlogTasks.map((task) => (
                    <div key={task.id} className="glass p-4">
                      <div className="min-w-0">
                        <div className="font-semibold break-words">{task.title}</div>
                        {task.details && (
                          <div className="mt-2 text-sm text-[rgba(255,255,255,0.72)] break-words">
                            {task.details}
                          </div>
                        )}
                        <div className="mt-3 text-xs text-[rgba(255,255,255,0.65)]">
                          Criado por: <span className="font-mono">{client.slug}</span>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => approveTask(task.id)}
                          className="btn-primary px-4 py-2 text-sm font-semibold"
                        >
                          Aprovar para Sprint
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Tem certeza que deseja excluir a demanda "${task.title}"?`)) {
                              deleteTask(task.id);
                            }
                          }}
                          className="btn-glass px-4 py-2 text-sm font-semibold text-[rgb(254,202,202)]"
                          title="Excluir demanda"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full min-w-[760px]">
                    <thead>
                      <tr className="border-b border-[rgba(255,255,255,0.08)]">
                        <th className="text-left p-4 font-semibold text-[rgba(255,255,255,0.72)]">Título</th>
                        <th className="text-left p-4 font-semibold text-[rgba(255,255,255,0.72)]">Criado por</th>
                        <th className="text-left p-4 font-semibold text-[rgba(255,255,255,0.72)]">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backlogTasks.map((task) => (
                        <tr key={task.id} className="border-b border-[rgba(255,255,255,0.06)]">
                          <td className="p-4">
                            <div className="min-w-0">
                              <p className="font-semibold text-base break-words">{task.title}</p>
                              {task.details && (
                                <p className="text-sm text-[rgba(255,255,255,0.72)] mt-2 leading-relaxed break-words">{task.details}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-[rgba(255,255,255,0.65)] font-mono">{client.slug}</span>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2 flex-wrap">
                              <button onClick={() => approveTask(task.id)} className="btn-primary px-4 py-2 text-sm font-semibold">
                                Aprovar
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Tem certeza que deseja excluir a demanda "${task.title}"?`)) {
                                    deleteTask(task.id);
                                  }
                                }}
                                className="btn-glass px-4 py-2 text-sm font-semibold text-[rgb(254,202,202)]"
                              >
                                Excluir
                              </button>
                            </div>
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

        {/* Sprint Atual */}
        <section className="glass glow overflow-hidden">
          <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)]">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-bold truncate">
                Sprint Atual ({currentSprintNumber === 0 ? "Sprint 0" : `Sprint ${currentSprintNumber}`})
              </h2>
              <button onClick={() => refetch()} className="btn-glass px-4 py-2 font-semibold">
                Atualizar
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Na fila */}
              <div className="glass p-5">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-10 h-10 btn-primary rounded-xl flex items-center justify-center">
                    <span className="text-[rgba(11,15,22,0.9)] text-xl font-bold">↑</span>
                  </div>
                  <h3 className="font-bold text-lg">Na fila</h3>
                  <span className="ml-auto badge-warning text-xs font-bold px-2 py-1 rounded-full">
                    {queuedSprint.length}
                  </span>
                </div>
                <div className="space-y-3 min-h-[200px]">
                  {queuedSprint.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-[rgba(255,255,255,0.55)] text-sm">—</p>
                    </div>
                  ) : (
                    queuedSprint.map((task) => (
                      <div
                        key={task.id}
                        className="glass p-4 transition-all hover:glow"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-semibold leading-snug break-words">
                              {task.title}
                            </p>
                            {task.details && (
                              <p className="text-sm text-[rgba(255,255,255,0.72)] mt-2 line-clamp-2 leading-relaxed">
                                {task.details}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              if (confirm(`Tem certeza que deseja excluir a demanda "${task.title}"?`)) {
                                deleteTask(task.id);
                              }
                            }}
                            className="ml-2 btn-glass px-2 py-1 text-xs font-semibold text-[rgb(254,202,202)] flex-shrink-0"
                            title="Excluir demanda"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="space-y-2">
                          <select
                            value={task.status}
                            onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                            className="input-dark w-full text-sm px-3 py-2 font-medium focus:outline-none cursor-pointer"
                          >
                            <option value="queued">Na fila</option>
                            <option value="in_progress">Em produção</option>
                            <option value="alteration">Alteração</option>
                            <option value="done">Entregue</option>
                          </select>
                          {task.status === "alteration" && (
                            <p className="text-xs text-[rgba(255,255,255,0.72)] mt-2">
                              Alterações: <span className="font-bold">{(task as any).alteration_count ?? 0}</span>
                            </p>
                          )}

                          {(task as any).client_task_steps?.length > 0 && (
                            <details className="mt-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)]">
                              <summary className="cursor-pointer select-none px-3 py-2 flex items-center justify-between text-xs font-semibold">
                                <span className="truncate">Subtarefas</span>
                                <span className="text-[rgba(255,255,255,0.65)]">▾</span>
                              </summary>
                              <div className="px-3 pb-3 space-y-2">
                                {(task as any).client_task_steps
                                  .slice()
                                  .sort((a: any, b: any) => (a.step_order ?? 0) - (b.step_order ?? 0))
                                  .map((step: any) => (
                                    <label key={step.id} className="flex items-center gap-2 text-xs text-[rgba(255,255,255,0.72)] min-w-0">
                                      <input
                                        type="checkbox"
                                        checked={!!step.done}
                                        onChange={(e) => updateStepDone(step.id, e.target.checked)}
                                        className="h-4 w-4 accent-[hsl(var(--primary))]"
                                      />
                                      <span
                                        className={`h-2 w-2 rounded-full ${step.done ? "bg-green-400" : "bg-[hsl(var(--primary))]"}`}
                                      />
                                      <span className={`min-w-0 truncate ${step.done ? "line-through opacity-70" : ""}`}>{step.title}</span>
                                    </label>
                                  ))}
                              </div>
                            </details>
                          )}
                          {task.status === "done" && (
                            <input
                              type="url"
                              defaultValue={task.admin_completion_link || ""}
                              placeholder="Link da entrega (Docs, Sheets, Imgur, etc.)"
                              onBlur={(e) => updateCompletionLink(task.id, e.target.value)}
                              className="input-dark w-full text-xs px-3 py-2 focus:outline-none"
                            />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Em produção */}
              <div className="glass p-5">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-10 h-10 btn-primary rounded-xl flex items-center justify-center">
                    <span className="text-[rgba(11,15,22,0.9)] text-xl font-bold">⚙️</span>
                  </div>
                  <h3 className="font-bold text-lg">Em produção</h3>
                  <span className="ml-auto badge-warning text-xs font-bold px-2 py-1 rounded-full">
                    {inProgressSprint.length}
                  </span>
                </div>
                <div className="space-y-3 min-h-[200px]">
                  {inProgressSprint.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-[rgba(255,255,255,0.55)] text-sm">—</p>
                    </div>
                  ) : (
                    inProgressSprint.map((task) => (
                      <div
                        key={task.id}
                        className="glass p-4 transition-all hover:glow"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-semibold leading-snug break-words">
                              {task.title}
                            </p>
                            {task.details && (
                              <p className="text-sm text-[rgba(255,255,255,0.72)] mt-2 line-clamp-2 leading-relaxed">
                                {task.details}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              if (confirm(`Tem certeza que deseja excluir a demanda "${task.title}"?`)) {
                                deleteTask(task.id);
                              }
                            }}
                            className="ml-2 btn-glass px-2 py-1 text-xs font-semibold text-[rgb(254,202,202)] flex-shrink-0"
                            title="Excluir demanda"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="space-y-2">
                          <select
                            value={task.status}
                            onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                            className="input-dark w-full text-sm px-3 py-2 font-medium focus:outline-none cursor-pointer"
                          >
                            <option value="queued">Na fila</option>
                            <option value="in_progress">Em produção</option>
                            <option value="alteration">Alteração</option>
                            <option value="done">Entregue</option>
                          </select>
                          {task.status === "alteration" && (
                            <p className="text-xs text-[rgba(255,255,255,0.72)] mt-2">
                              Alterações: <span className="font-bold">{(task as any).alteration_count ?? 0}</span>
                            </p>
                          )}

                          {(task as any).client_task_steps?.length > 0 && (
                            <details className="mt-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)]">
                              <summary className="cursor-pointer select-none px-3 py-2 flex items-center justify-between text-xs font-semibold">
                                <span className="truncate">Subtarefas</span>
                                <span className="text-[rgba(255,255,255,0.65)]">▾</span>
                              </summary>
                              <div className="px-3 pb-3 space-y-2">
                                {(task as any).client_task_steps
                                  .slice()
                                  .sort((a: any, b: any) => (a.step_order ?? 0) - (b.step_order ?? 0))
                                  .map((step: any) => (
                                    <label key={step.id} className="flex items-center gap-2 text-xs text-[rgba(255,255,255,0.72)] min-w-0">
                                      <input
                                        type="checkbox"
                                        checked={!!step.done}
                                        onChange={(e) => updateStepDone(step.id, e.target.checked)}
                                        className="h-4 w-4 accent-[hsl(var(--primary))]"
                                      />
                                      <span className={`h-2 w-2 rounded-full ${step.done ? "bg-green-400" : "bg-[hsl(var(--primary))]"}`} />
                                      <span className={`min-w-0 truncate ${step.done ? "line-through opacity-70" : ""}`}>{step.title}</span>
                                    </label>
                                  ))}
                              </div>
                            </details>
                          )}
                          {task.status === "done" && (
                            <input
                              type="url"
                              defaultValue={task.admin_completion_link || ""}
                              placeholder="Link da entrega (Docs, Sheets, Imgur, etc.)"
                              onBlur={(e) => updateCompletionLink(task.id, e.target.value)}
                              className="input-dark w-full text-xs px-3 py-2 focus:outline-none"
                            />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Entregue */}
              <div className="glass p-5">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-10 h-10 btn-primary rounded-xl flex items-center justify-center">
                    <span className="text-[rgba(11,15,22,0.9)] text-xl font-bold">✓</span>
                  </div>
                  <h3 className="font-bold text-lg">Entregue</h3>
                  <span className="ml-auto badge-success text-xs font-bold px-2 py-1 rounded-full">
                    {doneSprint.length}
                  </span>
                </div>
                <div className="space-y-3 min-h-[200px]">
                  {doneSprint.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-[rgba(255,255,255,0.55)] text-sm">—</p>
                    </div>
                  ) : (
                    doneSprint.map((task) => (
                      <div
                        key={task.id}
                        className="glass p-4 transition-all hover:glow"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-semibold leading-snug break-words">
                              {task.title}
                            </p>
                            {task.details && (
                              <p className="text-sm text-[rgba(255,255,255,0.72)] mt-2 line-clamp-2 leading-relaxed">
                                {task.details}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              if (confirm(`Tem certeza que deseja excluir a demanda "${task.title}"?`)) {
                                deleteTask(task.id);
                              }
                            }}
                            className="ml-2 btn-glass px-2 py-1 text-xs font-semibold text-[rgb(254,202,202)] flex-shrink-0"
                            title="Excluir demanda"
                          >
                            ✕
                          </button>
                        </div>
                        <select
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                          className="input-dark w-full text-sm px-3 py-2 font-medium focus:outline-none cursor-pointer"
                        >
                          <option value="queued">Na fila</option>
                          <option value="in_progress">Em produção</option>
                          <option value="alteration">Alteração</option>
                          <option value="done">Entregue</option>
                        </select>

                        {(task as any).client_task_steps?.length > 0 && (
                          <details className="mt-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)]">
                            <summary className="cursor-pointer select-none px-3 py-2 flex items-center justify-between text-xs font-semibold">
                              <span className="truncate">Subtarefas</span>
                              <span className="text-[rgba(255,255,255,0.65)]">▾</span>
                            </summary>
                            <div className="px-3 pb-3 space-y-2">
                              {(task as any).client_task_steps
                                .slice()
                                .sort((a: any, b: any) => (a.step_order ?? 0) - (b.step_order ?? 0))
                                .map((step: any) => (
                                  <label key={step.id} className="flex items-center gap-2 text-xs text-[rgba(255,255,255,0.72)] min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={!!step.done}
                                      onChange={(e) => updateStepDone(step.id, e.target.checked)}
                                      className="h-4 w-4 accent-[hsl(var(--primary))]"
                                    />
                                    <span className={`h-2 w-2 rounded-full ${step.done ? "bg-green-400" : "bg-[hsl(var(--primary))]"}`} />
                                    <span className={`min-w-0 truncate ${step.done ? "line-through opacity-70" : ""}`}>{step.title}</span>
                                  </label>
                                ))}
                            </div>
                          </details>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Gerar Resumo */}
        <section className="glass glow overflow-hidden">
          <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)]">
            <h2 className="text-xl sm:text-2xl font-bold">Resumo Semanal (KR1)</h2>
          </div>
          <div className="p-6">
            <button
              onClick={() => setShowSummary(!showSummary)}
              className="btn-primary w-full px-6 py-4 font-bold text-lg"
            >
              {showSummary ? "▲ Ocultar Resumo" : "📊 Gerar mensagem de resumo pro cliente"}
            </button>

            {showSummary && (
              <div className="mt-6 space-y-4">
                <div className="glass p-4">
                  <label className="block text-sm font-semibold mb-2">
                    Resumo formatado (pronto para copiar):
                  </label>
                  <textarea
                    readOnly
                    value={generateSummary()}
                    rows={15}
                    className="input-dark w-full px-4 py-3 font-mono text-sm focus:outline-none"
                  />
                </div>
                <button
                  onClick={copyToClipboard}
                  className="btn-glass w-full px-6 py-4 font-bold text-lg"
                >
                  📋 Copiar Resumo para Área de Transferência
                </button>
                <p className="text-sm text-[rgba(255,255,255,0.65)] text-center">
                  Após copiar, cole no WhatsApp ou e-mail do cliente
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

