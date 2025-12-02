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

  const load = () => {
    setLoading(true);
    setError(null);

    supabase
      .from("clients")
      .select("*")
      .order("name", { ascending: true })
      .then(({ data, error: queryError }) => {
        if (queryError) {
          setError(new Error(queryError.message));
          setClients([]);
        } else {
          setClients((data as Client[]) || []);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error("Erro desconhecido"));
        setLoading(false);
      });
  };

  useEffect(() => load(), []);

  return { clients, loading, error, refetch: load };
}

