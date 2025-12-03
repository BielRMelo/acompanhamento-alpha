import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

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

export function useAllTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);

    supabase
      .from("client_tasks")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error: queryError }) => {
        if (queryError) {
          setError(new Error(queryError.message));
          setTasks([]);
        } else {
          setTasks((data as Task[]) || []);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error("Erro desconhecido"));
        setLoading(false);
      });
  };

  useEffect(() => {
    const fetchData = async () => {
      await load();
    };
    fetchData();
  }, []);

  const updateTaskStatus = async (taskId: string, newStatus: string, sprintKey?: string) => {
    const updateData: { status: string; sprint_key?: string } = { status: newStatus };
    if (sprintKey) {
      updateData.sprint_key = sprintKey;
    }

    const { error: updateError } = await supabase
      .from("client_tasks")
      .update(updateData)
      .eq("id", taskId);

    if (updateError) {
      setError(new Error(updateError.message));
    } else {
      load();
    }
  };

  return { tasks, loading, error, refetch: load, updateTaskStatus };
}

