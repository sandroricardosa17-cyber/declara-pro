import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { error } = await admin.auth.admin.updateUserById(
    "e8497dff-d5c7-4f05-9ddb-b94b25593a5e",
    { password: "Decole@2026!", email_confirm: true },
  );
  return new Response(JSON.stringify({ ok: !error, error: error?.message }), {
    headers: { "Content-Type": "application/json" },
  });
});
