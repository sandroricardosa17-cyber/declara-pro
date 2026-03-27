import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { client_email, client_name, documents, declaration_year } = await req.json();

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!client_email || !documents || documents.length === 0) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios: client_email, documents" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Generate signed URLs for each document (valid for 7 days)
    const docsWithUrls = [];
    for (const doc of documents) {
      const { data, error } = await supabase.storage
        .from("irpf-documents")
        .createSignedUrl(doc.file_path, 60 * 60 * 24 * 7); // 7 days

      if (data?.signedUrl) {
        docsWithUrls.push({
          title: doc.title || doc.file_name,
          file_name: doc.file_name,
          url: data.signedUrl,
        });
      }
    }

    if (docsWithUrls.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhum documento válido para enviar" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const docRows = docsWithUrls.map((d, i) => `
      <tr>
        <td style="padding: 10px 12px; font-size: 14px; border: 1px solid #e0e0e0;">${i + 1}</td>
        <td style="padding: 10px 12px; font-size: 14px; border: 1px solid #e0e0e0; font-weight: 500;">${d.title}</td>
        <td style="padding: 10px 12px; font-size: 14px; border: 1px solid #e0e0e0; text-align: center;">
          <a href="${d.url}" style="display: inline-block; background-color: #1B5E20; color: white; padding: 6px 16px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 500;">
            📥 Baixar
          </a>
        </td>
      </tr>
    `).join("");

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #1B5E20; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 20px;">DeclaraPro - IRPF</h1>
        </div>
        <div style="border: 1px solid #e0e0e0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; color: #333;">Olá <strong>${client_name || "Cliente"}</strong>,</p>
          <p style="font-size: 14px; color: #555;">
            Seguem os documentos referentes à sua declaração IRPF${declaration_year ? ` ${declaration_year}` : ""}:
          </p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="padding: 10px 12px; font-size: 13px; border: 1px solid #e0e0e0; text-align: left; width: 30px;">#</th>
                <th style="padding: 10px 12px; font-size: 13px; border: 1px solid #e0e0e0; text-align: left;">Documento</th>
                <th style="padding: 10px 12px; font-size: 13px; border: 1px solid #e0e0e0; text-align: center; width: 100px;">Download</th>
              </tr>
            </thead>
            <tbody>
              ${docRows}
            </tbody>
          </table>
          <p style="font-size: 12px; color: #999; margin-top: 16px;">
            ⚠️ Os links de download são válidos por 7 dias.
          </p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;" />
          <p style="font-size: 12px; color: #999; text-align: center;">
            DeclaraPro - Gestão de Declarações IRPF
          </p>
        </div>
      </div>
    `;

    const subject = `Seus documentos IRPF${declaration_year ? ` ${declaration_year}` : ""} - DeclaraPro`;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "IR Control <noreply@irpfcontrol.pro>",
        to: [client_email],
        subject,
        html: htmlBody,
      }),
    });

    const result = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend error:", result);
      return new Response(JSON.stringify({ error: result.message || "Erro ao enviar e-mail" }), {
        status: resendResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, sent: docsWithUrls.length }), {
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
