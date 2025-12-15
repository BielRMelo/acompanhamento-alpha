import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from("plans")
        .select("*")
        .order("name", { ascending: true });

      if (queryError) {
        throw new Error(`Falha ao carregar planos: ${queryError.message}`);
      }

      setPlans((data as Plan[]) || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Erro desconhecido");
      console.error("Error loading plans:", error);
      setError(error);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createPlan = async (name: string, description?: string) => {
    try {
      const { error: insertError } = await supabase
        .from("plans")
        .insert({ name, description });

      if (insertError) {
        throw new Error(`Falha ao criar plano: ${insertError.message}`);
      }

      await load();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Erro ao criar plano");
      console.error("Error creating plan:", error);
      setError(error);
      throw error;
    }
  };

  const updatePlan = async (id: string, name: string, description?: string) => {
    try {
      const { error: updateError } = await supabase
        .from("plans")
        .update({ name, description })
        .eq("id", id);

      if (updateError) {
        throw new Error(`Falha ao atualizar plano: ${updateError.message}`);
      }

      await load();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Erro ao atualizar plano");
      console.error("Error updating plan:", error);
      setError(error);
      throw error;
    }
  };

  const deletePlan = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from("plans")
        .delete()
        .eq("id", id);

      if (deleteError) {
        throw new Error(`Falha ao deletar plano: ${deleteError.message}`);
      }

      await load();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Erro ao deletar plano");
      console.error("Error deleting plan:", error);
      setError(error);
      throw error;
    }
  };

  return {
    plans,
    loading,
    error,
    refetch: load,
    createPlan,
    updatePlan,
    deletePlan,
  };
}
