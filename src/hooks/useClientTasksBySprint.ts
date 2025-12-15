import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentSprint } from "@/lib/utils";

export type TaskStatus = 'suggested' | 'queued' | 'in_progress' | 'alteration' | 'done' | 'completed' | 'rejected';
type TaskStatusUpdate = Exclude<TaskStatus, 'suggested'>;

interface TaskStep {
  id: string;
  task_id: string;
  step_order: number;
  title: string;
  done: boolean;
}

interface Task {
  id: string;
  title: string;
  details?: string;
  status: TaskStatus;
  alteration_count?: number;
  client_id: string;
  created_by: string;
  created_at: string;
  sprint_key?: string;
  admin_rejection_reason?: string;
  admin_completion_link?: string;
  client_task_steps?: TaskStep[];
  [key: string]: unknown;
}

export function useClientTasksBySprint(clientId: string | undefined, sprintKeyOverride?: string) {
  const [backlogTasks, setBacklogTasks] = useState<Task[]>([]);
  const [sprintTasks, setSprintTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const currentSprint = sprintKeyOverride ?? getCurrentSprint();

  const load = useCallback(async () => {
    if (!clientId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from("client_tasks")
        .select("*, client_task_steps(*)")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (queryError) {
        throw new Error(`Failed to fetch tasks: ${queryError.message}`);
      }

      const tasks = (data as Task[]) || [];
      
      // Backlog: tarefas sugeridas
      setBacklogTasks(tasks.filter((t) => t.status === "suggested"));
      
      // Sprint atual: tarefas com sprint_key atual e status queued, in_progress, done
      setSprintTasks(
        tasks.filter(
          (t) =>
            t.sprint_key === currentSprint &&
            ["queued", "in_progress", "alteration", "done"].includes(t.status)
        )
      );
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Erro desconhecido ao carregar tarefas");
      console.error("Error loading tasks:", error);
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [clientId, currentSprint]);

  useEffect(() => {
    load();
  }, [load]);

  const approveTask = async (taskId: string) => {
    try {
      const { error: updateError } = await supabase
        .from("client_tasks")
        .update({
          status: "queued",
          sprint_key: currentSprint,
        })
        .eq("id", taskId);

      if (updateError) {
        throw new Error(`Failed to approve task: ${updateError.message}`);
      }
      await load();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Erro desconhecido ao aprovar tarefa");
      console.error("Error approving task:", error);
      setError(error);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      // Ensure the status is one of the allowed values
      const validStatus: TaskStatusUpdate[] = ['queued', 'in_progress', 'alteration', 'done', 'completed', 'rejected'];
      const statusToUpdate = validStatus.includes(newStatus as TaskStatusUpdate)
        ? (newStatus as TaskStatusUpdate)
        : 'queued';

      const currentTask = sprintTasks.find((t) => t.id === taskId) || backlogTasks.find((t) => t.id === taskId);
      const movingIntoAlteration = statusToUpdate === 'alteration' && currentTask?.status !== 'alteration';
      const nextAlterationCount = movingIntoAlteration
        ? (Number(currentTask?.alteration_count || 0) + 1)
        : undefined;

      const updatePayload: { status: TaskStatus; alteration_count?: number } = { status: statusToUpdate as TaskStatus };
      if (typeof nextAlterationCount === 'number') {
        updatePayload.alteration_count = nextAlterationCount;
      }

      const { error: updateError } = await supabase
        .from("client_tasks")
        .update(updatePayload)
        .eq("id", taskId);

      if (updateError) {
        throw new Error(`Falha ao atualizar status da tarefa: ${updateError.message}`);
      }
      await load();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Erro desconhecido ao atualizar status da tarefa");
      console.error("Error updating task status:", error);
      setError(error);
    }
  };

  const updateStepDone = async (stepId: string, done: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from("client_task_steps")
        .update({ done })
        .eq("id", stepId);

      if (updateError) {
        throw new Error(`Falha ao atualizar subtarefa: ${updateError.message}`);
      }

      await load();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Erro desconhecido ao atualizar subtarefa");
      console.error("Error updating task step:", error);
      setError(error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from("client_tasks")
        .delete()
        .eq("id", taskId);

      if (deleteError) {
        throw new Error(`Failed to delete task: ${deleteError.message}`);
      }
      await load();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Erro desconhecido ao deletar tarefa");
      console.error("Error deleting task:", error);
      setError(error);
    }
  };

  return {
    backlogTasks,
    sprintTasks,
    loading,
    error,
    refetch: load,
    approveTask,
    updateTaskStatus,
    updateStepDone,
    deleteTask,
    currentSprint,
  };
}

