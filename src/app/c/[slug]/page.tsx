"use client";

import { useParams } from "next/navigation";
import { useClientBySlug } from "@/hooks/useClientBySlug";
import { useClientTasks } from "@/hooks/useClientTasks";
import { toast } from "sonner";
import PublicBrandHeader from "@/components/PublicBrandHeader";

function getStatusMeta(status: string) {
  switch (status) {
    case "suggested":
      return {
        label: "Em avaliação",
        dotClass: "bg-yellow-500 animate-pulse",
        badgeClass: "bg-yellow-500/15 text-yellow-400 border-yellow-500/60",
      };
    case "queued":
      return {
        label: "Na fila",
        dotClass: "bg-yellow-400 animate-pulse",
        badgeClass: "bg-yellow-500/10 text-yellow-300 border-yellow-500/50",
      };
    case "in_progress":
      return {
        label: "Em produção",
        dotClass: "bg-blue-400 animate-pulse",
        badgeClass: "bg-blue-500/10 text-blue-300 border-blue-400/50",
      };
    case "alteration":
      return {
        label: "Alteração",
        dotClass: "bg-purple-400 animate-pulse",
        badgeClass: "bg-purple-500/10 text-purple-300 border-purple-400/50",
      };
    case "done":
    case "completed":
      return {
        label: "Entregue",
        dotClass: "bg-green-400",
        badgeClass: "bg-green-500/10 text-green-300 border-green-400/50",
      };
    case "rejected":
      return {
        label: "Rejeitada",
        dotClass: "bg-red-400",
        badgeClass: "bg-red-500/10 text-red-300 border-red-400/50",
      };
    default:
      return {
        label: status,
        dotClass: "bg-gray-400",
        badgeClass: "bg-gray-500/10 text-gray-300 border-gray-400/40",
      };
  }
}

function StepsDrawer({ steps }: { steps: Array<{ id: string; title: string; step_order: number; done: boolean }> }) {
  const ordered = (steps || []).slice().sort((a, b) => (a.step_order ?? 0) - (b.step_order ?? 0));
  if (ordered.length === 0) return null;

  return (
    <details className="mt-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)]">
      <summary className="cursor-pointer select-none px-3 py-2 flex items-center justify-between text-xs font-semibold">
        <span className="truncate">Subtarefas</span>
        <span className="text-[rgba(255,255,255,0.65)]">▾</span>
      </summary>
      <div className="px-3 pb-3 space-y-2">
        {ordered.map((s) => (
          <div key={s.id} className="flex items-center gap-2 min-w-0">
            <span
              className={`h-2 w-2 rounded-full ${s.done ? "bg-green-400" : "bg-[hsl(var(--primary))]"}`}
              title={s.done ? "Concluída" : "Pendente"}
            />
            <span className={`text-xs text-[rgba(255,255,255,0.72)] min-w-0 truncate ${s.done ? "line-through opacity-70" : ""}`}>
              {s.title}
            </span>
          </div>
        ))}
      </div>
    </details>
  );
}

function StatusBadge({ status }: { status: string }) {
  const meta = getStatusMeta(status);
  return (
    <span
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-[11px] font-semibold tracking-wide whitespace-nowrap ${meta.badgeClass}`}
      title={`Status: ${meta.label}`}
    >
      <span className={`h-2 w-2 rounded-full ${meta.dotClass}`} />
      {meta.label}
    </span>
  );
}

export default function ClientPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { client, loading: loadingClient, error: clientError } = useClientBySlug(slug);
  const { tasks, loading: loadingTasks, error: tasksError, createTask } = useClientTasks(client?.id);

  async function handleSubmit(formData: FormData) {
    const title = String(formData.get("title"));
    const details = String(formData.get("details"));
    await createTask(title, details);
    // Limpar o formulário após envio
    const form = document.querySelector("form") as HTMLFormElement;
    form?.reset();
    // Mostrar mensagem de sucesso
    toast.success("Demanda enviada para avaliação", { description: "Você já pode acompanhar o status abaixo." });
  }

  // Agrupar tarefas por status conforme o algoritmo
  const suggestedTasks = tasks.filter((t) => t.status === "suggested");
  const queuedTasks = tasks.filter((t) => t.status === "queued");
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress" || t.status === "alteration");
  const doneTasks = tasks.filter((t) => t.status === "done" || t.status === "completed");
  const rejectedTasks = tasks.filter((t) => t.status === "rejected");

  if (loadingClient) {
    return (
      <div className="min-h-screen flex items-center justify-center overflow-x-hidden">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-[hsl(var(--primary))] mb-4"></div>
          <p className="text-[rgba(255,255,255,0.72)] text-lg font-medium">Carregando cliente...</p>
        </div>
      </div>
    );
  }

  if (clientError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-x-hidden">
        <div className="glass glow p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold mb-2">Erro ao carregar</h2>
            <p className="text-[rgba(255,255,255,0.72)]">{clientError.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10 py-6 sm:py-10 space-y-6 sm:space-y-8 2xl:space-y-10">
        <PublicBrandHeader />
        {/* Header */}
        <div className="glass glow p-6 sm:p-8">
          <div className="text-xs text-[rgba(255,255,255,0.65)] font-bold">Cliente</div>
          <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 tracking-tight break-words">{client?.name ?? "Cliente"}</h1>
          <p className="text-[rgba(255,255,255,0.72)] text-sm sm:text-base lg:text-lg font-medium">Painel de acompanhamento de demandas</p>
        </div>

        {/* Descrição */}
        <div className="glass p-6">
          <p className="text-[rgba(255,255,255,0.88)] text-base sm:text-lg font-medium leading-relaxed">
            Envie suas demandas da semana e acompanhe o que está em avaliação, fila e produção.
          </p>
        </div>

        {/* Formulário de Nova Demanda */}
        <section className="glass glow overflow-hidden">
          <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)]">
            <h2 className="text-xl sm:text-2xl font-bold">Nova Demanda</h2>
          </div>
          <form action={handleSubmit} className="p-6 space-y-4">
            <div>
              <label htmlFor="title" className="block text-base font-semibold mb-2">
                O que você quer que a gente faça? <span className="text-[hsl(var(--primary))]">*</span>
              </label>
              <input
                id="title"
                name="title"
                required
                placeholder="Descreva sua necessidade..."
                className="input-dark w-full px-4 py-3 focus:outline-none transition-all text-base font-medium"
              />
            </div>
            <div>
              <label htmlFor="details" className="block text-base font-semibold mb-2">
                Detalhes / links / referências (opcional)
              </label>
              <textarea
                id="details"
                name="details"
                rows={4}
                placeholder="Adicione links, referências ou detalhes adicionais..."
                className="input-dark w-full px-4 py-3 focus:outline-none transition-all resize-none text-base font-medium"
              />
            </div>
            <button
              type="submit"
              className="btn-primary w-full font-bold py-4 px-6 text-lg"
            >
              Enviar para avaliação
            </button>
          </form>
        </section>

        {/* Demandas rejeitadas e concluídas */}
        <section className="glass glow overflow-hidden">
          <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)] flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <h2 className="text-xl sm:text-2xl font-bold">Histórico de decisões</h2>
            <p className="text-[rgba(255,255,255,0.65)] text-sm font-medium">
              Veja os motivos de rejeição e os links das entregas feitas para você.
            </p>
          </div>
          <div className="p-6 space-y-6">
            {/* Rejeitadas */}
            <div className="glass p-4">
              <h3 className="font-bold mb-3">Demandas rejeitadas</h3>
              {rejectedTasks.length === 0 ? (
                <p className="text-[rgba(255,255,255,0.55)] text-sm">Nenhuma demanda rejeitada até o momento.</p>
              ) : (
                <>
                  {/* Mobile cards */}
                  <div className="md:hidden space-y-3">
                    {rejectedTasks.map((task) => (
                      <div key={task.id} className="btn-glass p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-semibold break-words">{task.title}</div>
                            <div className="mt-2 text-sm text-[rgba(255,255,255,0.72)] whitespace-pre-line break-words">
                              {task.admin_rejection_reason || "Motivo ainda não informado."}
                            </div>
                          </div>
                          <span className="badge-destructive px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap">Rejeitada</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm min-w-[640px]">
                      <thead>
                        <tr className="border-b border-[rgba(255,255,255,0.08)]">
                          <th className="text-left p-2 font-semibold text-[rgba(255,255,255,0.72)]">Demanda</th>
                          <th className="text-left p-2 font-semibold text-[rgba(255,255,255,0.72)]">Motivo da rejeição</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rejectedTasks.map((task) => (
                          <tr key={task.id} className="border-b border-[rgba(255,255,255,0.06)]">
                            <td className="p-2 align-top font-medium break-words">{task.title}</td>
                            <td className="p-2 text-[rgba(255,255,255,0.72)] whitespace-pre-line break-words">
                              {task.admin_rejection_reason || "Motivo ainda não informado."}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Concluídas / entregues */}
            <div className="glass p-4">
              <h3 className="font-bold mb-3">Demandas concluídas / entregues</h3>
              {doneTasks.length === 0 ? (
                <p className="text-[rgba(255,255,255,0.55)] text-sm">Nenhuma entrega registrada ainda.</p>
              ) : (
                <>
                  {/* Mobile cards */}
                  <div className="md:hidden space-y-3">
                    {doneTasks.map((task) => (
                      <div key={task.id} className="btn-glass p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-semibold break-words">{task.title}</div>
                            <div className="mt-2">
                              {task.admin_completion_link ? (
                                <a
                                  href={task.admin_completion_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn-glass inline-flex items-center px-3 py-2 text-xs font-semibold"
                                >
                                  Abrir entrega
                                </a>
                              ) : (
                                <span className="text-[rgba(255,255,255,0.55)] text-sm">Link ainda não informado.</span>
                              )}
                            </div>
                          </div>
                          <span className="badge-success px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap">Entregue</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm min-w-[640px]">
                      <thead>
                        <tr className="border-b border-[rgba(255,255,255,0.08)]">
                          <th className="text-left p-2 font-semibold text-[rgba(255,255,255,0.72)]">Demanda</th>
                          <th className="text-left p-2 font-semibold text-[rgba(255,255,255,0.72)]">Link de transparência</th>
                        </tr>
                      </thead>
                      <tbody>
                        {doneTasks.map((task) => (
                          <tr key={task.id} className="border-b border-[rgba(255,255,255,0.06)]">
                            <td className="p-2 align-top font-medium break-words">{task.title}</td>
                            <td className="p-2">
                              {task.admin_completion_link ? (
                                <a
                                  href={task.admin_completion_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[hsl(var(--primary))] underline hover:opacity-90"
                                >
                                  Abrir entrega
                                </a>
                              ) : (
                                <span className="text-[rgba(255,255,255,0.55)]">Link ainda não informado.</span>
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
          </div>
        </section>

        {/* Lista de Demandas - 3 Colunas */}
        <section className="glass glow overflow-hidden">
          <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)]">
            <h2 className="text-xl sm:text-2xl font-bold">Acompanhamento de Demandas</h2>
          </div>
          <div className="p-6">
            {tasksError && (
              <div className="mb-4 p-4 btn-glass">
                <p className="font-medium">Erro: {tasksError.message}</p>
              </div>
            )}

            {loadingTasks ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))] mb-4"></div>
                <p className="text-[rgba(255,255,255,0.72)]">Carregando demandas...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 2xl:gap-8">
                {/* Coluna 1: Enviadas para avaliação */}
                <div className="glass p-4 min-w-0">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">☰</span>
                    <h3 className="font-bold truncate">Enviadas para avaliação</h3>
                  </div>
                  <div className="space-y-2">
                    {suggestedTasks.length === 0 ? (
                      <p className="text-[rgba(255,255,255,0.55)] text-sm">—</p>
                    ) : (
                      <ul className="space-y-2">
                    {suggestedTasks.map((task) => (
                      <li key={task.id} className="btn-glass p-3 rounded-xl min-w-0">
                        <div className="flex items-center justify-between gap-3 min-w-0">
                          <p className="min-w-0 flex-1 truncate whitespace-nowrap text-base font-medium">
                            {task.title}
                          </p>
                          <span className="shrink-0">
                            <StatusBadge status={task.status} />
                          </span>
                        </div>
                        <StepsDrawer steps={((task as any).client_task_steps || []) as any} />
                      </li>
                    ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Coluna 2: Aprovadas / na fila */}
                <div className="glass p-4 min-w-0">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">↑</span>
                    <h3 className="font-bold truncate">Aprovadas / na fila</h3>
                  </div>
                  <div className="space-y-2">
                    {queuedTasks.length === 0 ? (
                      <p className="text-[rgba(255,255,255,0.55)] text-sm">—</p>
                    ) : (
                      <ul className="space-y-2">
                    {queuedTasks.map((task) => (
                      <li key={task.id} className="btn-glass p-3 rounded-xl min-w-0">
                        <div className="flex items-center justify-between gap-3 min-w-0">
                          <p className="min-w-0 flex-1 truncate whitespace-nowrap text-base font-medium">
                            {task.title}
                          </p>
                          <span className="shrink-0">
                            <StatusBadge status={task.status} />
                          </span>
                        </div>
                        <StepsDrawer steps={((task as any).client_task_steps || []) as any} />
                      </li>
                    ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Coluna 3: Em produção / Entregues */}
                <div className="glass p-4 min-w-0">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">✈️</span>
                    <h3 className="font-bold truncate">Em produção / Entregues</h3>
                  </div>
                  <div className="space-y-3">
                    {inProgressTasks.length === 0 && doneTasks.length === 0 ? (
                      <p className="text-[rgba(255,255,255,0.55)] text-sm">—</p>
                    ) : (
                      <>
                        {inProgressTasks.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-[rgba(255,255,255,0.72)] mb-2">Em produção</p>
                            <ul className="space-y-2">
                              {inProgressTasks.map((task) => (
                                <li key={task.id} className="btn-glass p-3 rounded-xl min-w-0">
                                  <div className="flex items-center justify-between gap-3 min-w-0">
                                    <p className="min-w-0 flex-1 truncate whitespace-nowrap text-base font-medium">
                                      {task.title}
                                    </p>
                                    <span className="shrink-0">
                                      <StatusBadge status={task.status} />
                                    </span>
                                  </div>
                                  <StepsDrawer steps={((task as any).client_task_steps || []) as any} />
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {doneTasks.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-[rgba(255,255,255,0.72)] mb-2">Entregues recentemente</p>
                            <ul className="space-y-2">
                              {doneTasks.slice(0, 5).map((task) => (
                                <li key={task.id} className="btn-glass p-3 rounded-xl min-w-0">
                                  <div className="flex items-center justify-between gap-3 min-w-0">
                                    <p className="min-w-0 flex-1 truncate whitespace-nowrap text-base font-medium">
                                      {task.title}
                                    </p>
                                    <span className="shrink-0">
                                      <StatusBadge status={task.status} />
                                    </span>
                                  </div>
                                  <StepsDrawer steps={((task as any).client_task_steps || []) as any} />
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
