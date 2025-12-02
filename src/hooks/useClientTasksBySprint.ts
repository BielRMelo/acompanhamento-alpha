import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentSprint } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  details?: string;
  status: string;
  client_id: string;
  created_by: string;
  created_at: string;
  sprint_key?: string;
  [key: string]: unknown;
}

export function useClientTasksBySprint(clientId: string | undefined) {
  const [backlogTasks, setBacklogTasks] = useState<Task[]>([]);
  const [sprintTasks, setSprintTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const currentSprint = getCurrentSprint();

  const load = () => {
    if (!clientId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    supabase
      .from("client_tasks")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .then(({ data, error: queryError }) => {
        if (queryError) {
          setError(new Error(queryError.message));
          setBacklogTasks([]);
          setSprintTasks([]);
        } else {
          const tasks = (data as Task[]) || [];
          // Backlog: tarefas sugeridas (sem sprint_key ou sprint_key diferente da atual)
          setBacklogTasks(
            tasks.filter((t) => t.status === "suggested")
          );
          // Sprint atual: tarefas com sprint_key atual e status queued, in_progress, done
          setSprintTasks(
            tasks.filter(
              (t) =>
                t.sprint_key === currentSprint &&
                ["queued", "in_progress", "done"].includes(t.status)
            )
          );
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error("Erro desconhecido"));
        setLoading(false);
      });
  };

  useEffect(() => load(), [clientId, currentSprint]);

  const approveTask = async (taskId: string) => {
    const { error: updateError } = await supabase
      .from("client_tasks")
      .update({
        status: "queued",
        sprint_key: currentSprint,
      })
      .eq("id", taskId);

    if (updateError) {
      setError(new Error(updateError.message));
    } else {
      load();
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    const { error: updateError } = await supabase
      .from("client_tasks")
      .update({ status: newStatus })
      .eq("id", taskId);

    if (updateError) {
      setError(new Error(updateError.message));
    } else {
      load();
    }
  };

  const deleteTask = async (taskId: string) => {
    const { error: deleteError } = await supabase
      .from("client_tasks")
      .delete()
      .eq("id", taskId);

    if (deleteError) {
      setError(new Error(deleteError.message));
    } else {
      load();
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
    deleteTask,
    currentSprint,
  };
}

