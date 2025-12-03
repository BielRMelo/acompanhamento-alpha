import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { TaskStatus } from "./useClientTasksBySprint";

interface Task {
  id: string;
  title: string;
  details?: string;
  status: TaskStatus;
  client_id: string;
  created_by: string;
  created_at: string;
  sprint_key?: string;
  [key: string]: unknown;
}

export function useAllTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from("client_tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (queryError) {
        throw new Error(`Falha ao carregar tarefas: ${queryError.message}`);
      }

      setTasks((data as Task[]) || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Erro desconhecido ao carregar tarefas");
      console.error("Error loading tasks:", error);
      setError(error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateTaskStatus = async (taskId: string, newStatus: string, sprintKey?: string) => {
    try {
      const updateData: { status: TaskStatus; sprint_key?: string } = { 
        status: newStatus as TaskStatus 
      };
      
      if (sprintKey) {
        updateData.sprint_key = sprintKey;
      }

      const { error: updateError } = await supabase
        .from("client_tasks")
        .update(updateData)
        .eq("id", taskId);

      if (updateError) {
        throw new Error(`Falha ao atualizar status: ${updateError.message}`);
      }
      
      await load();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Erro desconhecido ao atualizar tarefa");
      console.error("Error updating task status:", error);
      setError(error);
    }
  };

  return {
    tasks,
    loading,
    error,
    refetch: load,
    updateTaskStatus,
  };
}

