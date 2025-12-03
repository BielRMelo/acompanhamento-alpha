"use client";

import { useParams } from "next/navigation";
import { useClientBySlug } from "@/hooks/useClientBySlug";
import { useClientTasks } from "@/hooks/useClientTasks";

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
    alert("Demanda enviada para avaliação ✅");
  }

  // Agrupar tarefas por status conforme o algoritmo
  const suggestedTasks = tasks.filter((t) => t.status === "suggested");
  const queuedTasks = tasks.filter((t) => t.status === "queued");
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
  const doneTasks = tasks.filter((t) => t.status === "done" || t.status === "completed");
  const rejectedTasks = tasks.filter((t) => t.status === "rejected");

  if (loadingClient) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-yellow-500 mb-4"></div>
          <p className="text-yellow-500 text-lg font-medium">Carregando cliente...</p>
        </div>
      </div>
    );
  }

  if (clientError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="bg-gray-900 border-2 border-yellow-500 rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-yellow-500 mb-2">Erro ao carregar</h2>
            <p className="text-yellow-400">{clientError.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="bg-gray-900 border-2 border-yellow-500 rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-yellow-500 mb-2">Cliente não encontrado</h2>
            <p className="text-yellow-400">Verifique se o link está correto.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <main className="p-6 max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-8 border-2 border-yellow-400">
          <h1 className="text-5xl font-bold mb-3 text-black tracking-tight">{client.name}</h1>
          <p className="text-black/90 text-lg font-medium">Painel de acompanhamento de demandas</p>
        </div>

        {/* Descrição */}
        <div className="bg-gray-900 border-2 border-yellow-500 rounded-xl shadow-lg p-6">
          <p className="text-yellow-500 text-lg font-medium leading-relaxed">
            Envie suas demandas da semana e acompanhe o que está em avaliação, fila e produção.
          </p>
        </div>

        {/* Formulário de Nova Demanda */}
        <section className="bg-gray-900 border-2 border-yellow-500 rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-4">
            <h2 className="text-2xl font-bold text-black">Nova Demanda</h2>
          </div>
          <form action={handleSubmit} className="p-6 space-y-4">
            <div>
              <label htmlFor="title" className="block text-base font-semibold text-yellow-500 mb-2">
                O que você quer que a gente faça? <span className="text-yellow-400">*</span>
              </label>
              <input
                id="title"
                name="title"
                required
                placeholder="Descreva sua necessidade..."
                className="w-full border-2 border-yellow-500 rounded-lg px-4 py-3 bg-gray-800 text-yellow-500 placeholder-yellow-500/50 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-400 transition-all text-base font-medium"
              />
            </div>
            <div>
              <label htmlFor="details" className="block text-base font-semibold text-yellow-500 mb-2">
                Detalhes / links / referências (opcional)
              </label>
              <textarea
                id="details"
                name="details"
                rows={4}
                placeholder="Adicione links, referências ou detalhes adicionais..."
                className="w-full border-2 border-yellow-500 rounded-lg px-4 py-3 bg-gray-800 text-yellow-500 placeholder-yellow-500/50 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-400 transition-all resize-none text-base font-medium"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold py-4 px-6 rounded-lg hover:from-yellow-400 hover:to-yellow-500 transition-all shadow-lg hover:shadow-yellow-500/50 transform hover:-translate-y-0.5 border-2 border-yellow-400 text-lg"
            >
              Enviar para avaliação
            </button>
          </form>
        </section>

        {/* Demandas rejeitadas e concluídas */}
        <section className="bg-gray-900 border-2 border-yellow-500 rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <h2 className="text-2xl font-bold text-black">Histórico de decisões</h2>
            <p className="text-black/80 text-sm font-medium">
              Veja os motivos de rejeição e os links das entregas feitas para você.
            </p>
          </div>
          <div className="p-6 space-y-6">
            {/* Rejeitadas */}
            <div className="bg-gray-800 border border-yellow-500 rounded-lg p-4">
              <h3 className="font-bold text-yellow-500 mb-3">Demandas rejeitadas</h3>
              {rejectedTasks.length === 0 ? (
                <p className="text-yellow-500/50 text-sm">Nenhuma demanda rejeitada até o momento.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-900 border-b border-yellow-500/40">
                        <th className="text-left p-2 font-semibold text-yellow-500">Demanda</th>
                        <th className="text-left p-2 font-semibold text-yellow-500">Motivo da rejeição</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rejectedTasks.map((task) => (
                        <tr key={task.id} className="border-b border-yellow-500/20">
                          <td className="p-2 align-top text-yellow-500 font-medium">
                            {task.title}
                          </td>
                          <td className="p-2 text-yellow-400 whitespace-pre-line">
                            {task.admin_rejection_reason || "Motivo ainda não informado."}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Concluídas / entregues */}
            <div className="bg-gray-800 border border-yellow-500 rounded-lg p-4">
              <h3 className="font-bold text-yellow-500 mb-3">Demandas concluídas / entregues</h3>
              {doneTasks.length === 0 ? (
                <p className="text-yellow-500/50 text-sm">Nenhuma entrega registrada ainda.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-900 border-b border-yellow-500/40">
                        <th className="text-left p-2 font-semibold text-yellow-500">Demanda</th>
                        <th className="text-left p-2 font-semibold text-yellow-500">Link de transparência</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doneTasks.map((task) => (
                        <tr key={task.id} className="border-b border-yellow-500/20">
                          <td className="p-2 align-top text-yellow-500 font-medium">
                            {task.title}
                          </td>
                          <td className="p-2">
                            {task.admin_completion_link ? (
                              <a
                                href={task.admin_completion_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-yellow-400 underline hover:text-yellow-300"
                              >
                                Abrir entrega
                              </a>
                            ) : (
                              <span className="text-yellow-500/60">
                                Link ainda não informado.
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Lista de Demandas - 3 Colunas */}
        <section className="bg-gray-900 border-2 border-yellow-500 rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-4">
            <h2 className="text-2xl font-bold text-black">Acompanhamento de Demandas</h2>
          </div>
          <div className="p-6">
            {tasksError && (
              <div className="mb-4 p-4 bg-gray-800 border-2 border-yellow-500 rounded-lg">
                <p className="text-yellow-500 font-medium">Erro: {tasksError.message}</p>
              </div>
            )}

            {loadingTasks ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mb-4"></div>
                <p className="text-yellow-500">Carregando demandas...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Coluna 1: Enviadas para avaliação */}
                <div className="bg-gray-800 border-2 border-yellow-500 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">☰</span>
                    <h3 className="font-bold text-yellow-500">Enviadas para avaliação</h3>
                  </div>
                  <div className="space-y-2">
                    {suggestedTasks.length === 0 ? (
                      <p className="text-yellow-500/50 text-sm">—</p>
                    ) : (
                      <ul className="space-y-2">
                    {suggestedTasks.map((task) => (
                      <li key={task.id} className="bg-gray-900 border border-yellow-500 p-3 rounded">
                        <p className="text-base text-yellow-500 font-medium">{task.title}</p>
                      </li>
                    ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Coluna 2: Aprovadas / na fila */}
                <div className="bg-gray-800 border-2 border-yellow-500 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">↑</span>
                    <h3 className="font-bold text-yellow-500">Aprovadas / na fila</h3>
                  </div>
                  <div className="space-y-2">
                    {queuedTasks.length === 0 ? (
                      <p className="text-yellow-500/50 text-sm">—</p>
                    ) : (
                      <ul className="space-y-2">
                    {queuedTasks.map((task) => (
                      <li key={task.id} className="bg-gray-900 border border-yellow-500 p-3 rounded">
                        <p className="text-base text-yellow-500 font-medium">{task.title}</p>
                      </li>
                    ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Coluna 3: Em produção / Entregues */}
                <div className="bg-gray-800 border-2 border-yellow-500 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">✈️</span>
                    <h3 className="font-bold text-yellow-500">Em produção / Entregues</h3>
                  </div>
                  <div className="space-y-3">
                    {inProgressTasks.length === 0 && doneTasks.length === 0 ? (
                      <p className="text-yellow-500/50 text-sm">—</p>
                    ) : (
                      <>
                        {inProgressTasks.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-yellow-500 mb-2">Em produção</p>
                            <ul className="space-y-2">
                              {inProgressTasks.map((task) => (
                                <li key={task.id} className="bg-gray-900 border border-yellow-500 p-3 rounded">
                                  <p className="text-base text-yellow-500 font-medium">{task.title}</p>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {doneTasks.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-yellow-500 mb-2">Entregues recentemente</p>
                            <ul className="space-y-2">
                              {doneTasks.slice(0, 5).map((task) => (
                                <li key={task.id} className="bg-gray-900 border border-yellow-500 p-3 rounded">
                                  <p className="text-base text-yellow-500 font-medium">{task.title}</p>
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
