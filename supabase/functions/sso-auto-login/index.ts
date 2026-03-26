import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  
  try {
    const { token } = await req.json();
    
    const validateRes = await fetch('https://xmvspnueewjsdtrhoyrk.supabase.co/functions/v1/validate-sso-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const validateData = await validateRes.json();
    
    if (!validateData.valid || !validateData.email) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const email = validateData.email;
    const password = 'sso_decole_2026_' + email.split('@')[0];
    const fullName = validateData.user_metadata?.full_name || email;
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const serviceClient = createClient(supabaseUrl, serviceKey);
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    
    let { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({ email, password });
    
    if (signInError) {
      const { error: createError } = await serviceClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      
      if (createError && !createError.message.includes('already')) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (createError?.message.includes('already')) {
        const { data: { users } } = await serviceClient.auth.admin.listUsers();
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
          await serviceClient.auth.admin.updateUser(existingUser.id, { password });
        }
      }
      
      const retry = await anonClient.auth.signInWithPassword({ email, password });
      signInData = retry.data;
      signInError = retry.error;
    }
    
    if (signInError || !signInData.session) {
      return new Response(JSON.stringify({ error: 'Falha no login: ' + signInError?.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({
      access_token: signInData.session.access_token,
      refresh_token: signInData.session.refresh_token,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
