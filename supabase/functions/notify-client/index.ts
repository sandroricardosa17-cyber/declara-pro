import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STATUS_LABELS: Record<string, string> = {
  aguardando_documentos: "Aguardando Documentos",
  em_andamento: "Em Andamento",
  em_revisao: "Em Revisão",
  finalizada: "Finalizada",
  enviada: "Enviada",
  em_processamento: "Em Processamento",
  processada: "Processada",
};

const TYPE_LABELS: Record<string, string> = {
  simplificada: "Simplificada",
  completa: "Completa",
  complexa: "Complexa",
};

const RESULT_LABELS: Record<string, string> = {
  a_restituir: "A Restituir",
  a_pagar: "A Pagar",
  sem_imposto: "Sem Imposto",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { declaration_id, new_status } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch declaration with client info
    const { data: dec, error: decErr } = await supabase
      .from("declarations")
      .select("*, clients(*)")
      .eq("id", declaration_id)
      .single();

    if (decErr || !dec) {
      return new Response(JSON.stringify({ error: "Declaração não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const client = dec.clients;
    if (!client?.email) {
      return new Response(JSON.stringify({ message: "Cliente sem e-mail, notificação não enviada" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const statusLabel = STATUS_LABELS[new_status] || new_status;
    const typeLabel = TYPE_LABELS[dec.type] || dec.type;
    const resultText = dec.result ? RESULT_LABELS[dec.result] || "" : "";
    const valueText = dec.result_value
      ? `R$ ${Number(dec.result_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
      : "";
    const installmentsText = dec.tax_installments ? ` em ${dec.tax_installments}x` : "";

    const subject = `IRPF ${dec.year_base}/${dec.exercise_year} - Status: ${statusLabel}`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #1B5E20; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 20px;">DeclaraPro - IRPF</h1>
        </div>
        <div style="border: 1px solid #e0e0e0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; color: #333;">Olá <strong>${client.name}</strong>,</p>
          <p style="font-size: 14px; color: #555;">
            Sua declaração de Imposto de Renda foi atualizada:
          </p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr>
              <td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; font-size: 13px; border: 1px solid #e0e0e0;">Ano Base</td>
              <td style="padding: 8px 12px; font-size: 13px; border: 1px solid #e0e0e0;">${dec.year_base}/${dec.exercise_year}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; font-size: 13px; border: 1px solid #e0e0e0;">Tipo</td>
              <td style="padding: 8px 12px; font-size: 13px; border: 1px solid #e0e0e0;">${typeLabel}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; font-size: 13px; border: 1px solid #e0e0e0;">Status</td>
              <td style="padding: 8px 12px; font-size: 13px; border: 1px solid #e0e0e0; color: #1B5E20; font-weight: bold;">${statusLabel}</td>
            </tr>
            ${resultText ? `
            <tr>
              <td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; font-size: 13px; border: 1px solid #e0e0e0;">Resultado</td>
              <td style="padding: 8px 12px; font-size: 13px; border: 1px solid #e0e0e0;">${resultText} ${valueText}${installmentsText}</td>
            </tr>` : ""}
          </table>
          <p style="font-size: 12px; color: #999; margin-top: 24px; text-align: center;">
            Este é um e-mail automático do sistema DeclaraPro.
          </p>
        </div>
      </div>
    `;

    // Send via Resend if API key is available
    if (resendApiKey) {
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "DeclaraPro <onboarding@resend.dev>",
          to: [client.email],
          subject,
          html: htmlBody,
        }),
      });

      const resendResult = await resendResponse.json();
      console.log("Resend result:", resendResult);

      return new Response(JSON.stringify({ success: true, method: "resend", result: resendResult }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: log notification
    console.log(`Notification would be sent to ${client.email}: ${subject}`);
    return new Response(JSON.stringify({ success: true, method: "logged", message: "Sem API Resend configurada. Notificação registrada no log." }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
