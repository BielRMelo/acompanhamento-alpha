import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Client {
  id: string;
  name: string;
  slug: string;
  access_code?: string | null;
  [key: string]: unknown;
}

export function useClientByAccessCode(code: string | undefined) {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!code) {
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
          .eq("access_code", code)
          .limit(2);

        if (queryError) throw new Error(queryError.message);

        const rows = (data || []) as Client[];
        if (rows.length === 0) {
          setError(new Error("Código não encontrado"));
          setClient(null);
          return;
        }

        if (rows.length > 1) {
          setError(new Error("Código duplicado. Fale com o suporte."));
          setClient(rows[0]);
          return;
        }

        setClient(rows[0]);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Erro desconhecido"));
        setClient(null);
      } finally {
        setLoading(false);
      }
    };

    loadClient();
  }, [code]);

  return { client, loading, error };
}
