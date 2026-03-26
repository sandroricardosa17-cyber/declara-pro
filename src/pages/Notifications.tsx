import { useState } from "react";
import { useClients } from "@/hooks/useData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send, Mail, User, MessageSquare } from "lucide-react";

export default function Notifications() {
  const { data: clients = [] } = useClients();
  const { toast } = useToast();
  const [selectedClient, setSelectedClient] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<{ client: string; subject: string; time: string }[]>([]);

  const selectedClientData = clients.find((c) => c.id === selectedClient);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientData) return;

    if (!selectedClientData.email) {
      toast({ title: "Erro", description: "Este cliente não possui e-mail cadastrado.", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-client-email", {
        body: {
          client_id: selectedClientData.id,
          to_email: selectedClientData.email,
          client_name: selectedClientData.name,
          subject,
          message,
        },
      });

      if (error) throw error;

      toast({ title: "E-mail enviado!", description: `Mensagem enviada para ${selectedClientData.name}` });
      setHistory((prev) => [
        { client: selectedClientData.name, subject, time: new Date().toLocaleString("pt-BR") },
        ...prev,
      ]);
      setSubject("");
      setMessage("");
      setSelectedClient("");
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message || "Tente novamente", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notificações</h1>
        <p className="text-sm text-muted-foreground">Envie mensagens por e-mail para seus clientes</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Send Form */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" /> Enviar E-mail
          </h2>
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Cliente *</label>
              <select
                required
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Selecione um cliente...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.email ? `(${c.email})` : "— sem e-mail"}
                  </option>
                ))}
              </select>
            </div>

            {selectedClientData && (
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Para:</span>
                <span className="font-medium">{selectedClientData.email || "Sem e-mail cadastrado"}</span>
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium">Assunto *</label>
              <input
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Atualização da sua declaração IRPF"
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Mensagem *</label>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="Escreva sua mensagem aqui..."
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={sending || !selectedClient}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {sending ? "Enviando..." : "Enviar E-mail"}
            </button>
          </form>
        </div>

        {/* History */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" /> Mensagens Enviadas
            </h2>
          </div>
          {history.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              Nenhuma mensagem enviada nesta sessão.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {history.map((h, i) => (
                <div key={i} className="px-5 py-3.5">
                  <p className="text-sm font-medium">{h.client}</p>
                  <p className="text-xs text-muted-foreground">{h.subject}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{h.time}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
