import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

export interface PlanTask {
  id: string;
  plan_id: string;
  sprint_number: number;
  title: string;
  details: string | null;
  created_at: string;
}

export function usePlanTasks(planId?: string) {
  const [tasks, setTasks] = useState<PlanTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("plan_tasks")
        .select("*")
        .order("sprint_number", { ascending: true })
        .order("title", { ascending: true });

      if (planId) {
        query = query.eq("plan_id", planId);
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        throw new Error(`Falha ao carregar demandas: ${queryError.message}`);
      }

      setTasks((data as PlanTask[]) || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Erro desconhecido");
      console.error("Error loading plan tasks:", error);
      setError(error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    load();
  }, [load]);

  const createTask = async (
    planId: string,
    sprintNumber: number,
    title: string,
    details?: string
  ) => {
    try {
      const { error: insertError } = await supabase.from("plan_tasks").insert({
        plan_id: planId,
        sprint_number: sprintNumber,
        title,
        details,
      });

      if (insertError) {
        throw new Error(`Falha ao criar demanda: ${insertError.message}`);
      }

      await load();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Erro ao criar demanda");
      console.error("Error creating plan task:", error);
      setError(error);
      throw error;
    }
  };

  const updateTask = async (
    id: string,
    sprintNumber: number,
    title: string,
    details?: string
  ) => {
    try {
      const { error: updateError } = await supabase
        .from("plan_tasks")
        .update({ sprint_number: sprintNumber, title, details })
        .eq("id", id);

      if (updateError) {
        throw new Error(`Falha ao atualizar demanda: ${updateError.message}`);
      }

      await load();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Erro ao atualizar demanda");
      console.error("Error updating plan task:", error);
      setError(error);
      throw error;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from("plan_tasks")
        .delete()
        .eq("id", id);

      if (deleteError) {
        throw new Error(`Falha ao deletar demanda: ${deleteError.message}`);
      }

      await load();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Erro ao deletar demanda");
      console.error("Error deleting plan task:", error);
      setError(error);
      throw error;
    }
  };

  // Agrupa tarefas por sprint
  const tasksBySprint = tasks.reduce((acc, task) => {
    const sprint = task.sprint_number;
    if (!acc[sprint]) {
      acc[sprint] = [];
    }
    acc[sprint].push(task);
    return acc;
  }, {} as Record<number, PlanTask[]>);

  return {
    tasks,
    tasksBySprint,
    loading,
    error,
    refetch: load,
    createTask,
    updateTask,
    deleteTask,
  };
}
