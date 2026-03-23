import { useState } from "react";
import { useDeclarations, useClients } from "@/hooks/useData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge, PaymentBadge, RiskBadge } from "@/components/StatusBadge";
import { Search, Plus, AlertTriangle, X } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type DeclarationStatus = Database["public"]["Enums"]["declaration_status"];

const RESULT_LABELS: Record<string, { label: string; color: string }> = {
  a_restituir: { label: "A Restituir", color: "text-status-success" },
  a_pagar: { label: "A Pagar", color: "text-status-danger" },
  sem_imposto: { label: "Sem Imposto", color: "text-muted-foreground" },
};

const statusFilters: { value: DeclarationStatus | "all"; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "aguardando_documentos", label: "Aguardando Docs" },
  { value: "em_andamento", label: "Em Andamento" },
  { value: "em_revisao", label: "Em Revisão" },
  { value: "finalizada", label: "Finalizada" },
  { value: "enviada", label: "Enviada" },
  { value: "processada", label: "Processada" },
];

export default function Declarations() {
  const { data: declarations = [], isLoading } = useDeclarations();
  const { data: clients = [] } = useClients();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DeclarationStatus | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ client_id: "", year_base: "2024", type: "completa" as "completa" | "simplificada" });

  const filtered = declarations.filter((d) => {
    const clientName = (d as any).clients?.name || "";
    const matchSearch = clientName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const yearBase = parseInt(form.year_base);
    const { error } = await supabase.from("declarations").insert({
      user_id: user.id,
      client_id: form.client_id,
      year_base: yearBase,
      exercise_year: yearBase + 1,
      type: form.type,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Declaração criada!" });
    queryClient.invalidateQueries({ queryKey: ["declarations"] });
    setShowForm(false);
    setForm({ client_id: "", year_base: "2024", type: "completa" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Declarações IRPF</h1>
          <p className="text-sm text-muted-foreground">{declarations.length} declarações registradas</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> Nova Declaração
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Nova Declaração</h2>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>
          {clients.length === 0 ? (
            <p className="text-sm text-muted-foreground">Cadastre um cliente primeiro antes de criar uma declaração.</p>
          ) : (
            <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Cliente *</label>
                <select required value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Selecione...</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Ano-base *</label>
                <input required type="number" value={form.year_base} onChange={(e) => setForm({ ...form, year_base: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Tipo</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="completa">Completa</option>
                  <option value="simplificada">Simplificada</option>
                </select>
              </div>
              <div className="sm:col-span-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-input px-4 py-2 text-sm hover:bg-muted transition-colors">Cancelar</button>
                <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">Criar</button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Buscar por cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-64 rounded-lg border border-input bg-card pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {statusFilters.map((f) => (
            <button key={f.value} onClick={() => setStatusFilter(f.value)} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${statusFilter === f.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            {declarations.length === 0 ? "Nenhuma declaração. Crie a primeira!" : "Nenhum resultado."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Cliente</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Ano</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Resultado</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Risco</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((dec) => {
                  const clientName = (dec as any).clients?.name || "—";
                  const initials = clientName.split(" ").map((n: string) => n[0]).slice(0, 2).join("");
                  return (
                    <tr key={dec.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">{initials}</div>
                          <div>
                            <p className="font-medium">{clientName}</p>
                            {dec.malha_fina && <span className="inline-flex items-center gap-1 text-[10px] font-medium text-status-danger"><AlertTriangle className="h-3 w-3" /> Malha Fina</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">{dec.year_base}/{dec.exercise_year}</td>
                      <td className="px-5 py-3.5 text-xs">{dec.type === "completa" ? "Completa" : "Simplificada"}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={dec.status} /></td>
                      <td className="px-5 py-3.5">
                        {dec.result ? (
                          <div>
                            <span className={`text-xs font-medium ${RESULT_LABELS[dec.result]?.color || ""}`}>{RESULT_LABELS[dec.result]?.label}</span>
                            {dec.result_value && <p className="text-xs text-muted-foreground">R$ {Number(dec.result_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>}
                          </div>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="px-5 py-3.5"><RiskBadge risk={dec.fiscal_risk} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
