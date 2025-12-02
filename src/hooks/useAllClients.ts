import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Client {
  id: string;
  name: string;
  slug: string;
  [key: string]: unknown;
}

export function useAllClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = async () => {
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
  };

  useEffect(() => load(), []);

  return { clients, loading, error, refetch: load };
}

