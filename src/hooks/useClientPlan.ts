import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Client {
  id: string;
  name: string;
  slug: string;
  plan_id: string | null;
  current_sprint: number | null;
}

export function useClientPlan() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Atualiza o plano de um cliente
  const updateClientPlan = async (clientId: string, planId: string | null) => {
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from("clients")
        .update({ plan_id: planId })
        .eq("id", clientId);

      if (updateError) {
        throw new Error(`Falha ao atualizar plano do cliente: ${updateError.message}`);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Erro ao atualizar plano");
      console.error("Error updating client plan:", error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Atualiza a sprint atual de um cliente
  const updateClientSprint = async (clientId: string, sprintNumber: number) => {
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from("clients")
        .update({ current_sprint: sprintNumber })
        .eq("id", clientId);

      if (updateError) {
        throw new Error(`Falha ao atualizar sprint do cliente: ${updateError.message}`);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Erro ao atualizar sprint");
      console.error("Error updating client sprint:", error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Gera as tarefas da sprint atual do cliente baseado no plano
  const generateSprintTasks = async (clientId: string, planId: string, sprintNumber: number) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Busca as demandas do plano para esta sprint
      const { data: planTasks, error: fetchError } = await supabase
        .from("plan_tasks")
        .select("*")
        .eq("plan_id", planId)
        .eq("sprint_number", sprintNumber);

      if (fetchError) {
        throw new Error(`Falha ao buscar demandas do plano: ${fetchError.message}`);
      }

      if (!planTasks || planTasks.length === 0) {
        return { created: 0, message: "Nenhuma demanda configurada para esta sprint" };
      }

      // 2. Verifica quais tarefas já existem para não duplicar
      const { data: existingTasks, error: existingError } = await supabase
        .from("client_tasks")
        .select("title")
        .eq("client_id", clientId)
        .eq("sprint_key", `sprint-${sprintNumber}`);

      if (existingError) {
        throw new Error(`Falha ao verificar tarefas existentes: ${existingError.message}`);
      }

      const existingTitles = new Set(existingTasks?.map((t) => t.title) || []);

      // 3. Filtra apenas as tarefas que não existem ainda
      const newTasks = planTasks.filter((pt) => !existingTitles.has(pt.title));

      if (newTasks.length === 0) {
        return { created: 0, message: "Todas as demandas desta sprint já foram criadas" };
      }

      // 4. Busca templates de subtarefas (se existirem)
      const planTaskIds = newTasks.map((pt) => pt.id);
      const { data: planTaskSteps, error: stepsError } = await supabase
        .from("plan_task_steps")
        .select("*")
        .in("plan_task_id", planTaskIds)
        .order("step_order", { ascending: true });

      if (stepsError) {
        throw new Error(`Falha ao buscar subtarefas do template: ${stepsError.message}`);
      }

      const stepsByPlanTaskId = new Map<string, Array<{ title: string; step_order: number }>>();
      (planTaskSteps || []).forEach((s: { plan_task_id: string; title: string; step_order: number }) => {
        const existing = stepsByPlanTaskId.get(s.plan_task_id) || [];
        existing.push({ title: s.title, step_order: s.step_order });
        stepsByPlanTaskId.set(s.plan_task_id, existing);
      });

      // 5. Cria as novas tarefas
      const tasksToInsert = newTasks.map((pt) => ({
        client_id: clientId,
        title: pt.title,
        details: pt.details,
        status: "queued",
        created_by: "admin",
        sprint_key: `sprint-${sprintNumber}`,
        template_plan_task_id: pt.id,
      }));

      const { data: insertedTasks, error: insertError } = await supabase
        .from("client_tasks")
        .insert(tasksToInsert)
        .select("id, template_plan_task_id");

      if (insertError) {
        throw new Error(`Falha ao criar tarefas: ${insertError.message}`);
      }

      // 6. Cria as subtarefas reais (client_task_steps) para cada tarefa criada
      const stepsToInsert: Array<{ task_id: string; step_order: number; title: string; done: boolean }> = [];
      (insertedTasks || []).forEach((t: { id: string; template_plan_task_id: string | null }) => {
        if (!t.template_plan_task_id) return;
        const steps = stepsByPlanTaskId.get(t.template_plan_task_id) || [];
        steps.forEach((s) => {
          stepsToInsert.push({
            task_id: t.id,
            step_order: s.step_order,
            title: s.title,
            done: false,
          });
        });
      });

      if (stepsToInsert.length > 0) {
        const { error: insertStepsError } = await supabase
          .from("client_task_steps")
          .insert(stepsToInsert);

        if (insertStepsError) {
          throw new Error(`Falha ao criar subtarefas: ${insertStepsError.message}`);
        }
      }

      return { created: newTasks.length, message: `${newTasks.length} demanda(s) criada(s)` };
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Erro ao gerar tarefas");
      console.error("Error generating sprint tasks:", error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Avança para a próxima sprint e gera as tarefas
  const advanceToNextSprint = async (client: Client) => {
    if (!client.plan_id) {
      throw new Error("Cliente não tem plano vinculado");
    }

    const currentSprint = client.current_sprint ?? 0;
    const nextSprint = Math.min(currentSprint + 1, 15);

    if (nextSprint === currentSprint) {
      return { message: "Cliente já está na sprint 15 (última)" };
    }

    // Atualiza a sprint
    await updateClientSprint(client.id, nextSprint);

    // Gera as tarefas da nova sprint
    const result = await generateSprintTasks(client.id, client.plan_id, nextSprint);

    return {
      newSprint: nextSprint,
      ...result,
    };
  };

  return {
    loading,
    error,
    updateClientPlan,
    updateClientSprint,
    generateSprintTasks,
    advanceToNextSprint,
  };
}
