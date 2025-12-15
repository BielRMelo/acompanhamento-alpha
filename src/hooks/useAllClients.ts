import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

export interface Client {
  id: string;
  name: string;
  slug: string;
  access_code?: string | null;
  plan_id: string | null;
  current_sprint: number | null;
  created_at: string;
}

export function useAllClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      setClients((data as Client[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erro desconhecido"));
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateClientPlan = async (clientId: string, planId: string | null) => {
    try {
      const { error: updateError } = await supabase
        .from("clients")
        .update({ plan_id: planId })
        .eq("id", clientId);

      if (updateError) {
        throw new Error(`Falha ao atualizar plano: ${updateError.message}`);
      }

      await load();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Erro ao atualizar plano");
      console.error("Error updating client plan:", error);
      setError(error);
      throw error;
    }
  };

  const updateClientSprint = async (clientId: string, sprintNumber: number) => {
    try {
      const { error: updateError } = await supabase
        .from("clients")
        .update({ current_sprint: sprintNumber })
        .eq("id", clientId);

      if (updateError) {
        throw new Error(`Falha ao atualizar sprint: ${updateError.message}`);
      }

      await load();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Erro ao atualizar sprint");
      console.error("Error updating client sprint:", error);
      setError(error);
      throw error;
    }
  };

  return { 
    clients, 
    loading, 
    error, 
    refetch: load,
    updateClientPlan,
    updateClientSprint,
  };
}

