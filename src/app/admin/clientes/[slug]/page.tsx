"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useClientBySlug } from "@/hooks/useClientBySlug";
import { useClientTasksBySprint } from "@/hooks/useClientTasksBySprint";
import { getCurrentSprint, formatSprint } from "@/lib/utils";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ClientAdminPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { client, loading: loadingClient, error: clientError } = useClientBySlug(slug);
  const {
    backlogTasks,
    sprintTasks,
    loading: loadingTasks,
    error: tasksError,
    refetch,
    approveTask,
    updateTaskStatus,
    deleteTask,
    currentSprint,
  } = useClientTasksBySprint(client?.id);

  const [showSummary, setShowSummary] = useState(false);

  // Agrupar tarefas da sprint por status
  const queuedSprint = sprintTasks.filter((t) => t.status === "queued");
  const inProgressSprint = sprintTasks.filter((t) => t.status === "in_progress");
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
    const sprintFormatted = formatSprint(currentSprint);

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
    alert("Resumo copiado para a área de transferência! ✅");
  };

  if (loadingClient) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-yellow-500 mb-4"></div>
          <p className="text-yellow-500 text-lg font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (clientError || !client) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="bg-gray-900 border-2 border-yellow-500 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-yellow-500 mb-2">Cliente não encontrado</h2>
          <Link
            href="/admin"
            className="mt-4 inline-block px-6 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 border-2 border-yellow-400"
          >
            Voltar para Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <main className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gray-900 border-2 border-yellow-500 rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center">
            <div>
              <nav className="text-sm text-yellow-400 mb-2">
                <Link href="/admin" className="hover:text-yellow-500">
                  Clientes
                </Link>
                {" > "}
                <span className="text-yellow-500 font-medium">{client.name}</span>
              </nav>
              <h1 className="text-5xl font-bold text-yellow-500 tracking-tight">
                Demandas - {client.name}
              </h1>
            </div>
            <Link
              href="/admin"
              className="px-6 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors font-medium shadow-sm border-2 border-yellow-400"
            >
              ← Voltar
            </Link>
          </div>
        </div>

        {/* Backlog */}
        <section className="bg-gray-900 border-2 border-yellow-500 rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-4">
            <h2 className="text-2xl font-bold text-black">Backlog</h2>
          </div>
          <div className="p-6">
            {loadingTasks ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500"></div>
              </div>
            ) : backlogTasks.length === 0 ? (
              <p className="text-yellow-500 text-center py-8">Nenhuma tarefa em avaliação.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-800 border-b-2 border-yellow-500">
                      <th className="text-left p-4 font-semibold text-yellow-500">Título</th>
                      <th className="text-left p-4 font-semibold text-yellow-500">Criado por</th>
                      <th className="text-left p-4 font-semibold text-yellow-500">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backlogTasks.map((task, index) => (
                      <tr
                        key={task.id}
                        className={`border-b border-yellow-500/20 hover:bg-gray-800 transition-colors ${
                          index % 2 === 0 ? "bg-gray-900" : "bg-gray-800"
                        }`}
                      >
                        <td className="p-4">
                          <div>
                            <p className="font-semibold text-yellow-500 text-base">{task.title}</p>
                            {task.details && (
                              <p className="text-base text-yellow-400 mt-2 leading-relaxed">{task.details}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-yellow-400">{client.slug}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => approveTask(task.id)}
                              className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors text-sm font-medium shadow-sm border-2 border-yellow-400"
                            >
                              ✓ Aprovar para Sprint
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Tem certeza que deseja excluir a demanda "${task.title}"?`)) {
                                  deleteTask(task.id);
                                }
                              }}
                              className="px-4 py-2 bg-gray-700 border-2 border-yellow-500 text-yellow-500 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium shadow-sm"
                              title="Excluir demanda"
                            >
                              ✕ Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Sprint Atual */}
        <section className="bg-gray-900 border-2 border-yellow-500 rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-black">
                Sprint Atual ({formatSprint(currentSprint)})
              </h2>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-black text-yellow-500 rounded-lg hover:bg-gray-900 transition-colors font-medium shadow-sm border-2 border-yellow-500"
              >
                🔄 Atualizar
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Na fila */}
              <div className="bg-gray-800 border-2 border-yellow-500 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                    <span className="text-black text-xl font-bold">↑</span>
                  </div>
                  <h3 className="font-bold text-lg text-yellow-500">Na fila</h3>
                  <span className="ml-auto bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                    {queuedSprint.length}
                  </span>
                </div>
                <div className="space-y-3 min-h-[200px]">
                  {queuedSprint.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-yellow-500/50 text-sm">—</p>
                    </div>
                  ) : (
                    queuedSprint.map((task) => (
                      <div
                        key={task.id}
                        className="bg-gray-900 rounded-lg p-4 border-2 border-yellow-500 hover:border-yellow-400 hover:shadow-lg hover:shadow-yellow-500/20 transition-all"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <p className="text-base font-semibold text-yellow-500 leading-snug">
                              {task.title}
                            </p>
                            {task.details && (
                              <p className="text-sm text-yellow-400 mt-2 line-clamp-2 leading-relaxed">
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
                            className="ml-2 px-2 py-1 bg-gray-700 border border-yellow-500 text-yellow-500 rounded-lg hover:bg-gray-600 transition-colors text-xs font-medium flex-shrink-0"
                            title="Excluir demanda"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="space-y-2">
                          <select
                            value={task.status}
                            onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                            className="w-full text-sm border-2 border-yellow-500 rounded-lg px-3 py-2 bg-gray-800 text-yellow-500 font-medium hover:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all cursor-pointer"
                          >
                            <option value="queued">Na fila</option>
                            <option value="in_progress">Em produção</option>
                            <option value="done">Entregue</option>
                          </select>
                          {task.status === "done" && (
                            <input
                              type="url"
                              defaultValue={task.admin_completion_link || ""}
                              placeholder="Link da entrega (Docs, Sheets, Imgur, etc.)"
                              onBlur={(e) => updateCompletionLink(task.id, e.target.value)}
                              className="w-full text-xs border border-yellow-500 rounded px-2 py-1 bg-gray-900 text-yellow-500 placeholder-yellow-500/50 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                            />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Em produção */}
              <div className="bg-gray-800 border-2 border-yellow-500 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                    <span className="text-black text-xl font-bold">⚙️</span>
                  </div>
                  <h3 className="font-bold text-lg text-yellow-500">Em produção</h3>
                  <span className="ml-auto bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                    {inProgressSprint.length}
                  </span>
                </div>
                <div className="space-y-3 min-h-[200px]">
                  {inProgressSprint.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-yellow-500/50 text-sm">—</p>
                    </div>
                  ) : (
                    inProgressSprint.map((task) => (
                      <div
                        key={task.id}
                        className="bg-gray-900 rounded-lg p-4 border-2 border-yellow-500 hover:border-yellow-400 hover:shadow-lg hover:shadow-yellow-500/20 transition-all"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <p className="text-base font-semibold text-yellow-500 leading-snug">
                              {task.title}
                            </p>
                            {task.details && (
                              <p className="text-sm text-yellow-400 mt-2 line-clamp-2 leading-relaxed">
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
                            className="ml-2 px-2 py-1 bg-gray-700 border border-yellow-500 text-yellow-500 rounded-lg hover:bg-gray-600 transition-colors text-xs font-medium flex-shrink-0"
                            title="Excluir demanda"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="space-y-2">
                          <select
                            value={task.status}
                            onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                            className="w-full text-sm border-2 border-yellow-500 rounded-lg px-3 py-2 bg-gray-800 text-yellow-500 font-medium hover:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all cursor-pointer"
                          >
                            <option value="queued">Na fila</option>
                            <option value="in_progress">Em produção</option>
                            <option value="done">Entregue</option>
                          </select>
                          <input
                            type="url"
                            defaultValue={task.admin_completion_link || ""}
                            placeholder="Link da entrega (Docs, Sheets, Imgur, etc.)"
                            onBlur={(e) => updateCompletionLink(task.id, e.target.value)}
                            className="w-full text-xs border border-yellow-500 rounded px-2 py-1 bg-gray-900 text-yellow-500 placeholder-yellow-500/50 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Entregue */}
              <div className="bg-gray-800 border-2 border-yellow-500 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                    <span className="text-black text-xl font-bold">✓</span>
                  </div>
                  <h3 className="font-bold text-lg text-yellow-500">Entregue</h3>
                  <span className="ml-auto bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                    {doneSprint.length}
                  </span>
                </div>
                <div className="space-y-3 min-h-[200px]">
                  {doneSprint.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-yellow-500/50 text-sm">—</p>
                    </div>
                  ) : (
                    doneSprint.map((task) => (
                      <div
                        key={task.id}
                        className="bg-gray-900 rounded-lg p-4 border-2 border-yellow-500 hover:border-yellow-400 hover:shadow-lg hover:shadow-yellow-500/20 transition-all"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <p className="text-base font-semibold text-yellow-500 leading-snug">
                              {task.title}
                            </p>
                            {task.details && (
                              <p className="text-sm text-yellow-400 mt-2 line-clamp-2 leading-relaxed">
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
                            className="ml-2 px-2 py-1 bg-gray-700 border border-yellow-500 text-yellow-500 rounded-lg hover:bg-gray-600 transition-colors text-xs font-medium flex-shrink-0"
                            title="Excluir demanda"
                          >
                            ✕
                          </button>
                        </div>
                        <select
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                          className="w-full text-sm border-2 border-yellow-500 rounded-lg px-3 py-2 bg-gray-800 text-yellow-500 font-medium hover:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all cursor-pointer"
                        >
                          <option value="queued">Na fila</option>
                          <option value="in_progress">Em produção</option>
                          <option value="done">Entregue</option>
                        </select>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Gerar Resumo */}
        <section className="bg-gray-900 border-2 border-yellow-500 rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-4">
            <h2 className="text-2xl font-bold text-black">Resumo Semanal (KR1)</h2>
          </div>
          <div className="p-6">
            <button
              onClick={() => setShowSummary(!showSummary)}
              className="w-full px-6 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black rounded-lg hover:from-yellow-400 hover:to-yellow-500 transition-all font-bold text-lg shadow-lg hover:shadow-xl hover:shadow-yellow-500/50 transform hover:-translate-y-0.5 border-2 border-yellow-400"
            >
              {showSummary ? "▲ Ocultar Resumo" : "📊 Gerar mensagem de resumo pro cliente"}
            </button>

            {showSummary && (
              <div className="mt-6 space-y-4">
                <div className="bg-gray-800 rounded-lg p-4 border-2 border-yellow-500">
                  <label className="block text-sm font-semibold text-yellow-500 mb-2">
                    Resumo formatado (pronto para copiar):
                  </label>
                  <textarea
                    readOnly
                    value={generateSummary()}
                    rows={15}
                    className="w-full border-2 border-yellow-500 rounded-lg px-4 py-3 text-yellow-500 font-mono text-sm bg-black focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={copyToClipboard}
                  className="w-full px-6 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black rounded-lg hover:from-yellow-400 hover:to-yellow-500 transition-all font-bold text-lg shadow-lg hover:shadow-xl hover:shadow-yellow-500/50 transform hover:-translate-y-0.5 border-2 border-yellow-400"
                >
                  📋 Copiar Resumo para Área de Transferência
                </button>
                <p className="text-sm text-yellow-400 text-center">
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

