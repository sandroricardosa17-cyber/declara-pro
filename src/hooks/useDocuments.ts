import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useDocuments(declarationId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["documents", declarationId],
    queryFn: async () => {
      let query = supabase.from("documents").select("*").order("created_at", { ascending: false });
      if (declarationId) query = query.eq("declaration_id", declarationId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!declarationId,
  });
}
