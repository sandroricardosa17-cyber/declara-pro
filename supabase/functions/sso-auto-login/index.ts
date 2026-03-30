import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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
      console.error('SSO validation failed:', JSON.stringify(validateData));
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const email = validateData.email;
    const password = 'sso_decole_2026_' + email.split('@')[0];
    const fullName = validateData.user_metadata?.full_name || email;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceClient = createClient(supabaseUrl, serviceKey);
    const anonClient = createClient(supabaseUrl, anonKey);

    // Step 1: Find or create user, always ensure password is correct
    const { data: { users } } = await serviceClient.auth.admin.listUsers({ perPage: 1000 });
    const existingUser = users?.find((u: any) => u.email === email);

    if (existingUser) {
      // Always update password to ensure it matches
      const { error: updateErr } = await serviceClient.auth.admin.updateUserById(existingUser.id, { 
        password,
        email_confirm: true,
      });
      if (updateErr) {
        console.error('Failed to update user password:', updateErr.message);
      }
    } else {
      // Create new user
      const { error: createError } = await serviceClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (createError) {
        console.error('Failed to create user:', createError.message);
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Step 2: Sign in with the guaranteed password
    const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({ email, password });

    if (signInError || !signInData.session) {
      console.error('Sign in failed after setup:', signInError?.message);
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
    console.error('SSO error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
