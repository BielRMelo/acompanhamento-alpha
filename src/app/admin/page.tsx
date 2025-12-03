"use client";

import Link from "next/link";
import { useAllClients } from "@/hooks/useAllClients";
import { useAllTasks } from "@/hooks/useAllTasks";
import { supabase } from "@/lib/supabaseClient";

export default function AdminPage() {
  const { clients, loading: loadingClients, error: clientsError, refetch: refetchClients } = useAllClients();
  const { tasks, loading: loadingTasks, error: tasksError, refetch: refetchTasks, updateTaskStatus } = useAllTasks();

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    await updateTaskStatus(taskId, newStatus);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "suggested":
        return "bg-yellow-500 text-black";
      case "in_progress":
        return "bg-yellow-600 text-black";
      case "completed":
      case "done":
        return "bg-yellow-400 text-black";
      case "rejected":
        return "bg-gray-700 text-yellow-500";
      default:
        return "bg-gray-600 text-yellow-500";
    }
  };

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

  return (
    <div className="min-h-screen bg-black">
      <main className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gray-900 border-2 border-yellow-500 rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-5xl font-bold text-yellow-500 mb-3 tracking-tight">
                Painel de Administrador
              </h1>
              <p className="text-yellow-400 text-lg font-medium">
                Gerencie clientes e demandas do sistema
              </p>
            </div>
            <Link
              href="/"
              className="px-6 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors font-medium shadow-sm border-2 border-yellow-400"
            >
              ← Voltar para Home
            </Link>
          </div>
        </div>

        {/* Seção de Clientes */}
        <section className="bg-gray-900 border-2 border-yellow-500 rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-black">Clientes</h2>
              <button
                onClick={refetchClients}
                className="px-4 py-2 bg-black text-yellow-500 rounded-lg hover:bg-gray-900 transition-colors font-medium shadow-sm border-2 border-yellow-500"
              >
                🔄 Atualizar
              </button>
            </div>
          </div>

          <div className="p-6">
            {clientsError && (
              <div className="mb-4 p-4 bg-gray-800 border-2 border-yellow-500 rounded-lg">
                <p className="text-yellow-500 font-medium">Erro: {clientsError.message}</p>
              </div>
            )}

            {loadingClients ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                <p className="mt-4 text-yellow-500">Carregando clientes...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-800 border-b-2 border-yellow-500">
                      <th className="text-left p-4 font-semibold text-yellow-500">Nome</th>
                      <th className="text-left p-4 font-semibold text-yellow-500">Slug</th>
                      <th className="text-left p-4 font-semibold text-yellow-500">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-8 text-center">
                          <p className="text-yellow-500 text-lg">Nenhum cliente encontrado.</p>
                        </td>
                      </tr>
                    ) : (
                      clients.map((client, index) => (
                        <tr
                          key={client.id}
                          className={`border-b border-yellow-500/20 hover:bg-gray-800 transition-colors ${
                            index % 2 === 0 ? "bg-gray-900" : "bg-gray-800"
                          }`}
                        >
                          <td className="p-4">
                            <span className="font-semibold text-yellow-500 text-base">{client.name}</span>
                          </td>
                          <td className="p-4">
                            <code className="bg-black border border-yellow-500 text-yellow-500 px-3 py-1.5 rounded-md text-sm font-mono">
                              {client.slug}
                            </code>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Link
                                href={`/admin/clientes/${client.slug}`}
                                className="inline-flex items-center px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors text-sm font-medium shadow-sm border-2 border-yellow-400"
                              >
                                Gerenciar →
                              </Link>
                              <Link
                                href={`/c/${client.slug}`}
                                className="inline-flex items-center px-4 py-2 bg-gray-800 border-2 border-yellow-500 text-yellow-500 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm"
                                target="_blank"
                              >
                                Ver Painel Cliente
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Seção de Tarefas */}
        <section className="bg-gray-900 border-2 border-yellow-500 rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-black">Todas as Demandas</h2>
              <button
                onClick={refetchTasks}
                className="px-4 py-2 bg-black text-yellow-500 rounded-lg hover:bg-gray-900 transition-colors font-medium shadow-sm border-2 border-yellow-500"
              >
                🔄 Atualizar
              </button>
            </div>
          </div>

          <div className="p-6">
            {tasksError && (
              <div className="mb-4 p-4 bg-gray-800 border-2 border-yellow-500 rounded-lg">
                <p className="text-yellow-500 font-medium">Erro: {tasksError.message}</p>
              </div>
            )}

            {loadingTasks ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                <p className="mt-4 text-yellow-500">Carregando tarefas...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📋</div>
                    <p className="text-yellow-500 text-lg font-medium">
                      Nenhuma demanda encontrada.
                    </p>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className="border-2 border-yellow-500 rounded-xl p-6 hover:shadow-lg hover:shadow-yellow-500/20 transition-all bg-gray-800"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 pr-4">
                          <h3 className="font-bold text-xl text-yellow-500 mb-2 tracking-tight">
                            {task.title}
                          </h3>
                          {task.details && (
                            <p className="text-yellow-400 leading-relaxed text-base">
                              {task.details}
                            </p>
                          )}
                        </div>
                        <span
                          className={`px-4 py-2 rounded-full text-sm font-bold shadow-sm ${getStatusColor(
                            task.status
                          )}`}
                        >
                          {getStatusLabel(task.status)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t border-yellow-500/30">
                        <div className="flex items-center gap-4 text-sm text-yellow-400">
                          <span className="flex items-center gap-1">
                            <strong className="text-yellow-500">Cliente:</strong>
                            <code className="bg-black/60 border border-yellow-500/60 text-yellow-400 px-2 py-0.5 rounded text-xs font-mono">
                              {getClientSlug(task.client_id)}
                            </code>
                          </span>
                          <span className="flex items-center gap-1">
                            <strong className="text-yellow-500">Data:</strong>
                            {new Date(task.created_at).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <div className="flex flex-col gap-2 w-64">
                          <select
                            value={task.status}
                            onChange={(e) =>
                              handleStatusChange(task.id, e.target.value)
                            }
                            className="px-4 py-2 border-2 border-yellow-500 rounded-lg bg-gray-900 text-yellow-500 font-medium hover:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all cursor-pointer"
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
                              className="w-full text-xs border border-yellow-500 rounded px-2 py-1 bg-gray-900 text-yellow-500 placeholder-yellow-500/50 focus:outline-none focus:ring-1 focus:ring-yellow-500 resize-none"
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
