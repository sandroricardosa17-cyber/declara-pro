import { useState, useRef } from "react";
import { useDeclarations, useClients } from "@/hooks/useData";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Search, Plus, AlertTriangle, X, Upload, MessageCircle, Mail,
  ChevronDown, User, ChevronRight, Eye, Edit2, FileText, Trash2,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type DeclarationStatus = Database["public"]["Enums"]["declaration_status"];

const FEE_TABLE: Record<string, number> = {
  simplificada: 200,
  completa: 400,
  complexa: 800,
};

const TYPE_LABELS: Record<string, string> = {
  simplificada: "Simplificada",
  completa: "Completa",
  complexa: "Complexa",
};

const RESULT_LABELS: Record<string, { label: string; color: string }> = {
  a_restituir: { label: "A Restituir", color: "text-status-success" },
  a_pagar: { label: "A Pagar", color: "text-status-danger" },
  sem_imposto: { label: "Sem Imposto", color: "text-muted-foreground" },
};

const STATUS_OPTIONS: { value: DeclarationStatus; label: string }[] = [
  { value: "aguardando_documentos", label: "Aguardando Docs" },
  { value: "em_andamento", label: "Em Andamento" },
  { value: "em_revisao", label: "Em Revisão" },
  { value: "finalizada", label: "Finalizada" },
  { value: "enviada", label: "Enviada" },
  { value: "em_processamento", label: "Em Processamento" },
  { value: "processada", label: "Processada" },
];

const NEXT_STATUS: Record<string, { next: DeclarationStatus; label: string }> = {
  aguardando_documentos: { next: "em_andamento", label: "Iniciar" },
  em_andamento: { next: "em_revisao", label: "Enviar p/ Revisão" },
  em_revisao: { next: "finalizada", label: "Finalizar" },
  finalizada: { next: "enviada", label: "Enviar" },
  enviada: { next: "em_processamento", label: "Em Processamento" },
  em_processamento: { next: "processada", label: "Processada" },
};

const statusFilters: { value: DeclarationStatus | "all"; label: string }[] = [
  { value: "all", label: "Todas" },
  ...STATUS_OPTIONS,
];

const COMMISSION_RATE = 0.10;

export default function Declarations() {
  const isAdmin = useIsAdmin();
  const { data: rawDeclarations = [], isLoading } = useDeclarations();
  const { data: clients = [] } = useClients();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DeclarationStatus | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [editingCollaborator, setEditingCollaborator] = useState<string | null>(null);
  const [viewingDocs, setViewingDocs] = useState<string | null>(null);
  const [editingDec, setEditingDec] = useState<any | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    client_id: "",
    year_base: "2024",
    type: "completa" as "completa" | "simplificada" | "complexa",
    collaborator_name: "",
  });
  const [deletingDec, setDeletingDec] = useState<string | null>(null);
  const [emailingDocs, setEmailingDocs] = useState<string | null>(null);
  const [emailDocTitles, setEmailDocTitles] = useState<Record<string, string>>({});
  const [emailDocSelected, setEmailDocSelected] = useState<Record<string, boolean>>({});
  const [emailUploading, setEmailUploading] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const emailFileRef = useRef<HTMLInputElement>(null);

  const [editForm, setEditForm] = useState({
    type: "completa",
    fee: 0,
    collaborator_name: "",
    result: "" as string,
    result_value: "",
    tax_installments: "",
    malha_fina: false,
    fiscal_risk: "baixo",
  });

  // Use all declarations (admin sees all via RLS)
  const declarations = rawDeclarations;

  // Fetch documents for viewing
  const { data: docs = [] } = useQuery({
    queryKey: ["documents", viewingDocs],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("declaration_id", viewingDocs!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!viewingDocs,
  });

  const { data: emailDocs = [], refetch: refetchEmailDocs } = useQuery({
    queryKey: ["documents", "email", emailingDocs],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("declaration_id", emailingDocs!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!emailingDocs,
  });

  const filtered = declarations.filter((d) => {
    const clientName = (d as any).clients?.name || "";
    const matchSearch = clientName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusCounts = declarations.reduce((acc, d) => {
    acc[d.status] = (acc[d.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const yearBase = parseInt(form.year_base);
    const fee = FEE_TABLE[form.type] || 0;
    const { error } = await supabase.from("declarations").insert({
      user_id: user.id,
      client_id: form.client_id,
      year_base: yearBase,
      exercise_year: yearBase + 1,
      type: form.type,
      fee,
      collaborator_name: form.collaborator_name || null,
    } as any);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Declaração criada!", description: `Honorário: R$ ${fee.toFixed(2)}` });
    queryClient.invalidateQueries({ queryKey: ["declarations"] });
    setShowForm(false);
    setForm({ client_id: "", year_base: "2024", type: "completa", collaborator_name: "" });
  };

  const notifyClient = async (declarationId: string, newStatus: string) => {
    try {
      await supabase.functions.invoke("notify-client", {
        body: { declaration_id: declarationId, new_status: newStatus },
      });
    } catch (err) {
      console.error("Notification error:", err);
    }
  };

  const handleAdvanceStatus = async (dec: any) => {
    const next = NEXT_STATUS[dec.status];
    if (!next) return;

    const { error } = await supabase
      .from("declarations")
      .update({ status: next.next })
      .eq("id", dec.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `Status atualizado para: ${STATUS_OPTIONS.find(s => s.value === next.next)?.label}` });
    queryClient.invalidateQueries({ queryKey: ["declarations"] });
    // Send notification
    notifyClient(dec.id, next.next);
  };

  const handleStatusChange = async (declarationId: string, newStatus: DeclarationStatus) => {
    const { error } = await supabase
      .from("declarations")
      .update({ status: newStatus })
      .eq("id", declarationId);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Status atualizado!" });
    queryClient.invalidateQueries({ queryKey: ["declarations"] });
    setEditingStatus(null);
    // Send notification
    notifyClient(declarationId, newStatus);
  };

  const handleCollaboratorChange = async (declarationId: string, name: string) => {
    const { error } = await supabase
      .from("declarations")
      .update({ collaborator_name: name || null } as any)
      .eq("id", declarationId);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Colaborador atualizado!" });
    queryClient.invalidateQueries({ queryKey: ["declarations"] });
    setEditingCollaborator(null);
  };

  const handleFileUpload = async (declarationId: string, files: FileList | null) => {
    if (!files || !user) return;
    const dec = declarations.find((d) => d.id === declarationId);
    if (!dec) return;
    for (const file of Array.from(files)) {
      const path = `${user.id}/${declarationId}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("irpf-documents").upload(path, file);
      if (uploadErr) {
        toast({ title: "Erro no upload", description: uploadErr.message, variant: "destructive" });
        continue;
      }
      await supabase.from("documents").insert({
        user_id: user.id,
        declaration_id: declarationId,
        client_id: dec.client_id,
        file_name: file.name,
        file_path: path,
        file_type: file.type,
        category: "outros",
      });
    }
    toast({ title: "Documentos enviados!" });
    queryClient.invalidateQueries({ queryKey: ["declarations"] });
    queryClient.invalidateQueries({ queryKey: ["documents"] });
    setUploadingFor(null);
  };

  const handleViewDoc = async (filePath: string) => {
    const { data } = await supabase.storage.from("irpf-documents").createSignedUrl(filePath, 3600);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    } else {
      toast({ title: "Erro ao abrir documento", variant: "destructive" });
    }
  };

  const openEditModal = (dec: any) => {
    setEditingDec(dec);
    setEditForm({
      type: dec.type,
      fee: Number(dec.fee || 0),
      collaborator_name: dec.collaborator_name || "",
      result: dec.result || "",
      result_value: dec.result_value ? String(dec.result_value) : "",
      tax_installments: dec.tax_installments ? String(dec.tax_installments) : "",
      malha_fina: dec.malha_fina || false,
      fiscal_risk: dec.fiscal_risk || "baixo",
    });
  };

  const handleEditSave = async () => {
    if (!editingDec) return;
    const { error } = await supabase
      .from("declarations")
      .update({
        type: editForm.type,
        fee: editForm.fee,
        collaborator_name: editForm.collaborator_name || null,
        result: editForm.result || null,
        result_value: editForm.result_value ? parseFloat(editForm.result_value) : null,
        tax_installments: editForm.tax_installments ? parseInt(editForm.tax_installments) : null,
        malha_fina: editForm.malha_fina,
        fiscal_risk: editForm.fiscal_risk,
      } as any)
      .eq("id", editingDec.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Declaração atualizada!" });
    queryClient.invalidateQueries({ queryKey: ["declarations"] });
    setEditingDec(null);
  };

  const sendGuide = (type: "whatsapp" | "email", dec: any) => {
    const client = clients.find((c) => c.id === dec.client_id);
    if (!client) return;
    const resultText = dec.result ? RESULT_LABELS[dec.result]?.label : "Pendente";
    const valueText = dec.result_value ? `R$ ${Number(dec.result_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "";
    const installmentsText = dec.tax_installments ? ` em ${dec.tax_installments}x` : "";
    const statusLabel = STATUS_OPTIONS.find(s => s.value === dec.status)?.label || dec.status;
    const message = `Olá ${client.name}! Sua declaração IRPF ${dec.year_base}/${dec.exercise_year} está com status: ${statusLabel}. Resultado: ${resultText}${valueText ? ` - ${valueText}${installmentsText}` : ""}. Tipo: ${TYPE_LABELS[dec.type]}. Honorário: R$ ${Number(dec.fee || 0).toFixed(2)}.`;
    if (type === "whatsapp") {
      const phone = (client.phone || "").replace(/\D/g, "");
      if (!phone) { toast({ title: "Cliente sem telefone cadastrado", variant: "destructive" }); return; }
      window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, "_blank");
    } else {
      if (!client.email) { toast({ title: "Cliente sem e-mail cadastrado", variant: "destructive" }); return; }
      window.open(`mailto:${client.email}?subject=${encodeURIComponent(`IRPF ${dec.year_base} - Atualização`)}&body=${encodeURIComponent(message)}`, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Declarações IRPF</h1>
          <p className="text-sm text-muted-foreground">
            {declarations.length} declarações registradas
            {isAdmin && <span className="ml-1 text-primary">(visão admin)</span>}
          </p>
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
            <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                <label className="mb-1 block text-sm font-medium">Tipo (Honorário)</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="simplificada">Simplificada — R$ {FEE_TABLE.simplificada}</option>
                  <option value="completa">Completa — R$ {FEE_TABLE.completa}</option>
                  <option value="complexa">Complexa — R$ {FEE_TABLE.complexa}</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Colaborador</label>
                <input value={form.collaborator_name} onChange={(e) => setForm({ ...form, collaborator_name: e.target.value })} placeholder="Nome do colaborador" className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="sm:col-span-2 lg:col-span-4 flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Honorário: <span className="font-semibold text-foreground">R$ {FEE_TABLE[form.type]?.toFixed(2)}</span> · Comissão (10%): <span className="font-semibold text-primary">R$ {(FEE_TABLE[form.type] * COMMISSION_RATE).toFixed(2)}</span></p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-input px-4 py-2 text-sm hover:bg-muted transition-colors">Cancelar</button>
                  <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">Criar</button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Search + Status filter tabs with counts */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Buscar por cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-64 rounded-lg border border-input bg-card pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {statusFilters.map((f) => {
            const count = f.value === "all" ? declarations.length : (statusCounts[f.value] || 0);
            return (
              <button key={f.value} onClick={() => setStatusFilter(f.value)} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${statusFilter === f.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                {f.label}
                <span className={`inline-flex items-center justify-center rounded-full min-w-[18px] h-[18px] px-1 text-[10px] font-bold ${statusFilter === f.value ? "bg-primary-foreground/20 text-primary-foreground" : "bg-background text-muted-foreground"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" className="hidden" onChange={(e) => { if (uploadingFor) handleFileUpload(uploadingFor, e.target.files); }} />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            {declarations.length === 0 ? "Nenhuma declaração. Crie a primeira!" : "Nenhum resultado para este filtro."}
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin" style={{ scrollbarColor: 'hsl(var(--border)) transparent' }}>
            <table className="min-w-[1200px] w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground sticky left-0 bg-muted/50 z-10 min-w-[180px] shadow-[2px_0_8px_-2px_rgba(0,0,0,0.08)]">Cliente</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Ano</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Honorário</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Avançar</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Resultado</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Colaborador</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Comissão</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((dec) => {
                  const clientName = (dec as any).clients?.name || "—";
                  const initials = clientName.split(" ").map((n: string) => n[0]).slice(0, 2).join("");
                  const fee = Number((dec as any).fee || 0);
                  const commission = fee * COMMISSION_RATE;
                  const collaborator = (dec as any).collaborator_name || "";
                  const nextAction = NEXT_STATUS[dec.status];
                  return (
                    <tr key={dec.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3.5 sticky left-0 bg-card z-10 shadow-[2px_0_8px_-2px_rgba(0,0,0,0.08)]">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground flex-shrink-0">{initials}</div>
                          <div>
                            <p className="font-medium whitespace-nowrap">{clientName}</p>
                            {dec.malha_fina && <span className="inline-flex items-center gap-1 text-[10px] font-medium text-status-danger"><AlertTriangle className="h-3 w-3" /> Malha Fina</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">{dec.year_base}/{dec.exercise_year}</td>
                      <td className="px-4 py-3.5 text-xs font-medium whitespace-nowrap">{TYPE_LABELS[dec.type] || dec.type}</td>
                      <td className="px-4 py-3.5 font-medium whitespace-nowrap">R$ {fee.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>

                      {/* Editable Status */}
                      <td className="px-4 py-3.5">
                        {editingStatus === dec.id ? (
                          <select
                            autoFocus
                            defaultValue={dec.status}
                            onChange={(e) => handleStatusChange(dec.id, e.target.value as DeclarationStatus)}
                            onBlur={() => setEditingStatus(null)}
                            className="h-8 rounded-lg border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                        ) : (
                          <button
                            onClick={() => setEditingStatus(dec.id)}
                            className="group flex items-center gap-1"
                            title="Clique para alterar o status"
                          >
                            <StatusBadge status={dec.status} />
                            <ChevronDown className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        )}
                      </td>

                      {/* Advance button */}
                      <td className="px-4 py-3.5">
                        {nextAction ? (
                          <button
                            onClick={() => handleAdvanceStatus(dec)}
                            className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors whitespace-nowrap"
                          >
                            {nextAction.label}
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Concluída</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        {dec.result ? (
                          <div>
                            <span className={`text-xs font-medium ${RESULT_LABELS[dec.result]?.color || ""}`}>{RESULT_LABELS[dec.result]?.label}</span>
                            {dec.result_value && <p className="text-xs text-muted-foreground whitespace-nowrap">R$ {Number(dec.result_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>}
                            {dec.result === "a_pagar" && (dec as any).tax_installments && (
                              <p className="text-[10px] text-muted-foreground">{(dec as any).tax_installments}x parcela(s)</p>
                            )}
                          </div>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </td>

                      {/* Editable Collaborator */}
                      <td className="px-4 py-3.5">
                        {editingCollaborator === dec.id ? (
                          <input
                            autoFocus
                            defaultValue={collaborator}
                            placeholder="Nome..."
                            onBlur={(e) => handleCollaboratorChange(dec.id, e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleCollaboratorChange(dec.id, (e.target as HTMLInputElement).value); }}
                            className="h-8 w-28 rounded-lg border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        ) : (
                          <button
                            onClick={() => setEditingCollaborator(dec.id)}
                            className="group flex items-center gap-1 text-xs whitespace-nowrap"
                            title="Clique para alterar o colaborador"
                          >
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span>{collaborator || "Atribuir"}</span>
                            <ChevronDown className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-xs font-medium text-primary whitespace-nowrap">R$ {commission.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEditModal(dec)} title="Editar declaração" className="rounded-md p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => setViewingDocs(dec.id)} title="Ver documentos" className="rounded-md p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                            <FileText className="h-4 w-4" />
                          </button>
                          <button onClick={() => { setUploadingFor(dec.id); fileRef.current?.click(); }} title="Upload documentos" className="rounded-md p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                            <Upload className="h-4 w-4" />
                          </button>
                          <button onClick={() => sendGuide("whatsapp", dec)} title="Enviar guia por WhatsApp" className="rounded-md p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-status-success">
                            <MessageCircle className="h-4 w-4" />
                          </button>
                          <button onClick={() => {
                            setEmailingDocs(dec.id);
                            setEmailDocTitles({});
                            setEmailDocSelected({});
                          }} title="Enviar documentos por E-mail" className="rounded-md p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-status-info">
                            <Mail className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDeletingDec(dec.id)} title="Excluir declaração" className="rounded-md p-1.5 hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Documents Modal */}
      {viewingDocs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Documentos</h2>
              <button onClick={() => setViewingDocs(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            {docs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum documento enviado.</p>
            ) : (
              <div className="space-y-2">
                {docs.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleDateString("pt-BR")}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleViewDoc(doc.file_path)}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                    >
                      <Eye className="h-3 w-3" /> Ver
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingDec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg">
            <h2 className="text-lg font-semibold mb-2">Excluir Declaração</h2>
            <p className="text-sm text-muted-foreground mb-6">Tem certeza que deseja excluir esta declaração? Esta ação não pode ser desfeita. Todos os documentos, pagamentos e tarefas vinculados também serão removidos.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeletingDec(null)} className="rounded-lg border border-input px-4 py-2 text-sm hover:bg-muted transition-colors">Cancelar</button>
              <button
                onClick={async () => {
                  // Delete related records first
                  await supabase.from("documents").delete().eq("declaration_id", deletingDec);
                  await supabase.from("payments").delete().eq("declaration_id", deletingDec);
                  await supabase.from("tasks").delete().eq("declaration_id", deletingDec);
                  const { error } = await supabase.from("declarations").delete().eq("id", deletingDec);
                  if (error) {
                    toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
                  } else {
                    toast({ title: "Declaração excluída!" });
                    queryClient.invalidateQueries({ queryKey: ["declarations"] });
                    queryClient.invalidateQueries({ queryKey: ["payments"] });
                    queryClient.invalidateQueries({ queryKey: ["tasks"] });
                    queryClient.invalidateQueries({ queryKey: ["documents"] });
                  }
                  setDeletingDec(null);
                }}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Declaration Modal */}
      {editingDec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Editar Declaração</h2>
              <button onClick={() => setEditingDec(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Tipo</label>
                  <select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value, fee: FEE_TABLE[e.target.value] || editForm.fee })} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="simplificada">Simplificada</option>
                    <option value="completa">Completa</option>
                    <option value="complexa">Complexa</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Honorário (R$)</label>
                  <input type="number" value={editForm.fee} onChange={(e) => setEditForm({ ...editForm, fee: parseFloat(e.target.value) || 0 })} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Colaborador</label>
                <input value={editForm.collaborator_name} onChange={(e) => setEditForm({ ...editForm, collaborator_name: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Resultado</label>
                  <select value={editForm.result} onChange={(e) => setEditForm({ ...editForm, result: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Sem resultado</option>
                    <option value="a_restituir">A Restituir</option>
                    <option value="a_pagar">A Pagar</option>
                    <option value="sem_imposto">Sem Imposto</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Valor (R$)</label>
                  <input type="number" step="0.01" value={editForm.result_value} onChange={(e) => setEditForm({ ...editForm, result_value: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
              {editForm.result === "a_pagar" && (
                <div>
                  <label className="mb-1 block text-sm font-medium">Nº de Parcelas do Imposto</label>
                  <input type="number" min="1" max="8" value={editForm.tax_installments} onChange={(e) => setEditForm({ ...editForm, tax_installments: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Risco Fiscal</label>
                  <select value={editForm.fiscal_risk} onChange={(e) => setEditForm({ ...editForm, fiscal_risk: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="baixo">Baixo</option>
                    <option value="medio">Médio</option>
                    <option value="alto">Alto</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input type="checkbox" checked={editForm.malha_fina} onChange={(e) => setEditForm({ ...editForm, malha_fina: e.target.checked })} className="rounded" />
                    Malha Fina
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setEditingDec(null)} className="rounded-lg border border-input px-4 py-2 text-sm hover:bg-muted transition-colors">Cancelar</button>
                <button onClick={handleEditSave} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Documents Modal */}
      {emailingDocs && (() => {
        const dec = declarations.find((d) => d.id === emailingDocs);
        const client = dec ? clients.find((c) => c.id === dec.client_id) : null;
        const selectedDocs = emailDocs.filter((d) => emailDocSelected[d.id]);

        const handleEmailUpload = async (files: FileList | null) => {
          if (!files || !user || !dec) return;
          setEmailUploading(true);
          for (const file of Array.from(files)) {
            const path = `${user.id}/${emailingDocs}/${Date.now()}_${file.name}`;
            const { error: uploadErr } = await supabase.storage.from("irpf-documents").upload(path, file);
            if (uploadErr) {
              toast({ title: "Erro no upload", description: uploadErr.message, variant: "destructive" });
              continue;
            }
            await supabase.from("documents").insert({
              user_id: user.id,
              declaration_id: emailingDocs,
              client_id: dec.client_id,
              file_name: file.name,
              file_path: path,
              file_type: file.type,
              category: "outros",
            });
          }
          await refetchEmailDocs();
          setEmailUploading(false);
          toast({ title: "Documentos enviados!" });
        };

        const handleSendDocsEmail = async () => {
          if (!client?.email) {
            toast({ title: "Cliente sem e-mail cadastrado", variant: "destructive" });
            return;
          }
          if (selectedDocs.length === 0) {
            toast({ title: "Selecione ao menos um documento", variant: "destructive" });
            return;
          }
          setEmailSending(true);
          try {
            const docsPayload = selectedDocs.map((d) => ({
              file_path: d.file_path,
              file_name: d.file_name,
              title: emailDocTitles[d.id] || d.file_name,
            }));
            const { data, error } = await supabase.functions.invoke("send-documents-email", {
              body: {
                client_email: client.email,
                client_name: client.name,
                documents: docsPayload,
                declaration_year: dec ? `${dec.year_base}/${dec.exercise_year}` : "",
              },
            });
            if (error) throw error;
            toast({ title: "E-mail enviado!", description: `${selectedDocs.length} documento(s) enviado(s) para ${client.email}` });
            setEmailingDocs(null);
          } catch (err: any) {
            toast({ title: "Erro ao enviar e-mail", description: err.message, variant: "destructive" });
          } finally {
            setEmailSending(false);
          }
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Enviar Documentos por E-mail</h2>
                  <p className="text-xs text-muted-foreground">
                    Cliente: <strong>{client?.name || "—"}</strong> · {client?.email || "Sem e-mail"}
                  </p>
                </div>
                <button onClick={() => setEmailingDocs(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
              </div>

              {/* Upload new documents */}
              <div className="mb-4">
                <input
                  ref={emailFileRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                  className="hidden"
                  onChange={(e) => handleEmailUpload(e.target.files)}
                />
                <button
                  onClick={() => emailFileRef.current?.click()}
                  disabled={emailUploading}
                  className="inline-flex items-center gap-2 rounded-lg border border-dashed border-input px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full justify-center"
                >
                  <Upload className="h-4 w-4" />
                  {emailUploading ? "Enviando..." : "Anexar novos documentos"}
                </button>
              </div>

              {/* Document list with titles */}
              {emailDocs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum documento. Anexe documentos acima.</p>
              ) : (
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">{emailDocs.length} documento(s)</p>
                    <button
                      onClick={() => {
                        const allSelected = emailDocs.every((d) => emailDocSelected[d.id]);
                        const newSelected: Record<string, boolean> = {};
                        emailDocs.forEach((d) => { newSelected[d.id] = !allSelected; });
                        setEmailDocSelected(newSelected);
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      {emailDocs.every((d) => emailDocSelected[d.id]) ? "Desmarcar todos" : "Selecionar todos"}
                    </button>
                  </div>
                  {emailDocs.map((doc) => (
                    <div key={doc.id} className={`rounded-lg border p-3 transition-colors ${emailDocSelected[doc.id] ? "border-primary bg-primary/5" : "border-border"}`}>
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={!!emailDocSelected[doc.id]}
                          onChange={(e) => setEmailDocSelected({ ...emailDocSelected, [doc.id]: e.target.checked })}
                          className="mt-1 rounded"
                        />
                        <div className="flex-1 space-y-1.5">
                          <p className="text-xs text-muted-foreground">{doc.file_name}</p>
                          <input
                            type="text"
                            placeholder="Título do documento (ex: Informe de Rendimentos)"
                            value={emailDocTitles[doc.id] || ""}
                            onChange={(e) => setEmailDocTitles({ ...emailDocTitles, [doc.id]: e.target.value })}
                            className="h-8 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Send button */}
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button onClick={() => setEmailingDocs(null)} className="rounded-lg border border-input px-4 py-2 text-sm hover:bg-muted transition-colors">Cancelar</button>
                <button
                  onClick={handleSendDocsEmail}
                  disabled={emailSending || selectedDocs.length === 0}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Mail className="h-4 w-4" />
                  {emailSending ? "Enviando..." : `Enviar ${selectedDocs.length} doc(s) por e-mail`}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
