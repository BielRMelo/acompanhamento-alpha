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
  admin_rejection_reason?: string;
  admin_completion_link?: string;
  [key: string]: unknown;
}

export function useClientTasks(clientId: string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = async () => {
    if (!clientId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from("client_tasks")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (queryError) {
        throw new Error(queryError.message);
      }

      setTasks((data as Task[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erro desconhecido"));
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await load();
    };
    fetchData();
  }, [clientId]);

  const createTask = async (title: string, details?: string) => {
    if (!clientId) return;

    const { error: insertError } = await supabase
      .from("client_tasks")
      .insert({
        client_id: clientId,
        title,
        details,
        created_by: "client",
        status: "suggested",
      });

    if (insertError) {
      setError(new Error(insertError.message));
    } else {
      load();
    }
  };

  return { tasks, loading, error, createTask };
}

