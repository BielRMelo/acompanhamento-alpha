import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Client {
  id: string;
  name: string;
  slug: string;
  [key: string]: unknown;
}

export function useClientBySlug(slug: string | undefined) {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    supabase
      .from("clients")
      .select("*")
      .eq("slug", slug)
      .single()
      .then(({ data, error: queryError }) => {
        if (queryError) {
          setError(new Error(queryError.message));
          setClient(null);
        } else {
          setClient(data as Client);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error("Erro desconhecido"));
        setLoading(false);
      });
  }, [slug]);

  return { client, loading, error };
}

