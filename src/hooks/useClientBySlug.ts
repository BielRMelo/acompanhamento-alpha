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

    const loadClient = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: queryError } = await supabase
          .from("clients")
          .select("*")
          .eq("slug", slug)
          .single();

        if (queryError) {
          setError(new Error(queryError.message));
          setClient(null);
        } else {
          setClient(data as Client);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Erro desconhecido"));
        setClient(null);
      } finally {
        setLoading(false);
      }
    };

    loadClient();
  }, [slug]);

  return { client, loading, error };
}

