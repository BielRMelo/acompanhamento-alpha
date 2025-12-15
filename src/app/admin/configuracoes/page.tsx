"use client";

import Link from "next/link";
import { useState } from "react";
import { usePlans, Plan } from "@/hooks/usePlans";
import { usePlanTasks, PlanTask } from "@/hooks/usePlanTasks";

export default function ConfiguracoesPage() {
  const { plans, loading: loadingPlans, error: plansError, createPlan, updatePlan, deletePlan, refetch: refetchPlans } = usePlans();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const { tasks, tasksBySprint, loading: loadingTasks, createTask, deleteTask, refetch: refetchTasks } = usePlanTasks(selectedPlan?.id);

  // Estados para formulários
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanDescription, setNewPlanDescription] = useState("");
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const [newTaskSprint, setNewTaskSprint] = useState(0);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDetails, setNewTaskDetails] = useState("");

  // Criar plano
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName.trim()) return;

    try {
      await createPlan(newPlanName.trim(), newPlanDescription.trim() || undefined);
      setNewPlanName("");
      setNewPlanDescription("");
    } catch (err) {
      console.error(err);
    }
  };

  // Atualizar plano
  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan || !editingPlan.name.trim()) return;

    try {
      await updatePlan(editingPlan.id, editingPlan.name.trim(), editingPlan.description || undefined);
      setEditingPlan(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Deletar plano
  const handleDeletePlan = async (plan: Plan) => {
    if (!confirm(`Tem certeza que deseja deletar o plano "${plan.name}"? Isso também deletará todas as demandas vinculadas.`)) return;

    try {
      await deletePlan(plan.id);
      if (selectedPlan?.id === plan.id) {
        setSelectedPlan(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Criar demanda
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !newTaskTitle.trim()) return;

    try {
      await createTask(selectedPlan.id, newTaskSprint, newTaskTitle.trim(), newTaskDetails.trim() || undefined);
      setNewTaskTitle("");
      setNewTaskDetails("");
    } catch (err) {
      console.error(err);
    }
  };

  // Deletar demanda
  const handleDeleteTask = async (task: PlanTask) => {
    if (!confirm(`Tem certeza que deseja deletar a demanda "${task.title}"?`)) return;

    try {
      await deleteTask(task.id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10 py-6 sm:py-8 space-y-8">
        {/* Header */}
        <div className="glass glow p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 min-w-0">
            <div className="min-w-0">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 tracking-tight truncate">
                Configurações de Planos
              </h1>
              <p className="text-[rgba(255,255,255,0.72)] text-sm sm:text-base lg:text-lg font-medium">
                Gerencie planos e suas demandas por sprint
              </p>
            </div>
            <Link
              href="/admin"
              className="btn-primary px-4 sm:px-6 py-3 font-semibold"
            >
              ← Voltar para Admin
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Seção de Planos */}
          <section className="glass glow overflow-hidden">
            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)]">
              <h2 className="text-xl sm:text-2xl font-bold">Planos</h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Formulário de novo plano */}
              <form onSubmit={handleCreatePlan} className="space-y-4 glass p-4">
                <h3 className="font-semibold">Criar Novo Plano</h3>
                <input
                  type="text"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  placeholder="Nome do plano (ex: Gold)"
                  className="input-dark w-full px-4 py-2 focus:outline-none"
                />
                <input
                  type="text"
                  value={newPlanDescription}
                  onChange={(e) => setNewPlanDescription(e.target.value)}
                  placeholder="Descrição (opcional)"
                  className="input-dark w-full px-4 py-2 focus:outline-none"
                />
                <button
                  type="submit"
                  className="btn-primary w-full px-4 py-2 font-semibold"
                >
                  + Criar Plano
                </button>
              </form>

              {plansError && (
                <div className="p-4 btn-glass">
                  <p className="font-medium">Erro: {plansError.message}</p>
                </div>
              )}

              {loadingPlans ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`p-4 rounded-xl transition-all cursor-pointer border ${
                        selectedPlan?.id === plan.id
                          ? "border-[rgba(245,158,11,0.30)] bg-[rgba(245,158,11,0.10)]"
                          : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.06)]"
                      }`}
                    >
                      {editingPlan?.id === plan.id ? (
                        <form onSubmit={handleUpdatePlan} className="space-y-2">
                          <input
                            type="text"
                            value={editingPlan.name}
                            onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                            className="input-dark w-full px-3 py-2 text-sm focus:outline-none"
                          />
                          <input
                            type="text"
                            value={editingPlan.description || ""}
                            onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                            placeholder="Descrição"
                            className="input-dark w-full px-3 py-2 text-sm focus:outline-none"
                          />
                          <div className="flex gap-2">
                            <button type="submit" className="btn-primary px-3 py-2 text-sm font-semibold">
                              Salvar
                            </button>
                            <button type="button" onClick={() => setEditingPlan(null)} className="btn-glass px-3 py-2 text-sm font-semibold">
                              Cancelar
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div onClick={() => setSelectedPlan(plan)}>
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-lg">{plan.name}</h4>
                              {plan.description && (
                                <p className="text-[rgba(255,255,255,0.65)] text-sm mt-1">{plan.description}</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingPlan(plan);
                                }}
                                className="btn-glass px-2 py-1 text-xs font-semibold"
                              >
                                Editar
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePlan(plan);
                                }}
                                className="btn-glass px-2 py-1 text-xs font-semibold text-[rgb(254,202,202)]"
                              >
                                Deletar
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {plans.length === 0 && (
                    <p className="text-[rgba(255,255,255,0.55)] text-center py-4">Nenhum plano cadastrado</p>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Seção de Demandas por Sprint */}
          <section className="glass glow overflow-hidden">
            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)]">
              <h2 className="text-xl sm:text-2xl font-bold truncate">
                Demandas {selectedPlan ? `- ${selectedPlan.name}` : ""}
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {!selectedPlan ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👈</div>
                  <p className="text-[rgba(255,255,255,0.72)]">Selecione um plano para ver/editar suas demandas</p>
                </div>
              ) : (
                <>
                  {/* Formulário de nova demanda */}
                  <form onSubmit={handleCreateTask} className="space-y-4 glass p-4">
                    <h3 className="font-semibold">Adicionar Demanda</h3>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={newTaskSprint}
                        onChange={(e) => setNewTaskSprint(Number(e.target.value))}
                        className="input-dark px-3 py-2 focus:outline-none cursor-pointer"
                      >
                        {Array.from({ length: 16 }, (_, i) => i).map((num) => (
                          <option key={num} value={num}>
                            {num === 0 ? "Sprint 0 (Onboarding)" : `Sprint ${num}`}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Título da demanda"
                        className="input-dark flex-1 px-4 py-2 focus:outline-none"
                      />
                    </div>
                    <input
                      type="text"
                      value={newTaskDetails}
                      onChange={(e) => setNewTaskDetails(e.target.value)}
                      placeholder="Detalhes (opcional)"
                      className="input-dark w-full px-4 py-2 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="btn-primary w-full px-4 py-2 font-semibold"
                    >
                      + Adicionar Demanda
                    </button>
                  </form>

                  {loadingTasks ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                      {Array.from({ length: 16 }, (_, i) => i).map((sprintNum) => {
                        const sprintTasks = tasksBySprint[sprintNum] || [];
                        if (sprintTasks.length === 0) return null;

                        return (
                          <div key={sprintNum} className="glass overflow-hidden">
                            <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.08)]">
                              <h4 className="font-bold">
                                {sprintNum === 0 ? "Sprint 0 (Onboarding)" : `Sprint ${sprintNum}`}
                              </h4>
                            </div>
                            <div className="p-3 space-y-2">
                              {sprintTasks.map((task) => (
                                <div
                                  key={task.id}
                                  className="flex justify-between items-start gap-3 p-3 btn-glass"
                                >
                                  <div className="min-w-0">
                                    <p className="font-medium break-words">{task.title}</p>
                                    {task.details && (
                                      <p className="text-[rgba(255,255,255,0.65)] text-sm break-words">{task.details}</p>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => handleDeleteTask(task)}
                                    className="btn-glass px-2 py-1 text-xs font-semibold text-[rgb(254,202,202)] shrink-0"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}

                      {tasks.length === 0 && (
                        <p className="text-[rgba(255,255,255,0.55)] text-center py-4">
                          Nenhuma demanda cadastrada para este plano
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
