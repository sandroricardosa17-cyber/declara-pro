import { useState } from "react";
import { useClients, useDeclarations } from "@/hooks/useData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Phone, Mail, X, Eye, EyeOff, Lock } from "lucide-react";

export default function Clients() {
  const { data: clients = [], isLoading } = useClients();
  const { data: declarations = [] } = useDeclarations();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", cpf: "", phone: "", email: "", address: "", profession: "", birth_date: "", notes: "", gov_password: "" });
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const filtered = clients.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.cpf.includes(search) || (c.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("clients").insert({
      ...form,
      user_id: user.id,
      birth_date: form.birth_date || null,
      gov_password: form.gov_password || null,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Cliente cadastrado!" });
    queryClient.invalidateQueries({ queryKey: ["clients"] });
    setShowForm(false);
    setForm({ name: "", cpf: "", phone: "", email: "", address: "", profession: "", birth_date: "", notes: "", gov_password: "" });
  };

  const togglePassword = (id: string) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground">{clients.length} clientes cadastrados</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> Novo Cliente
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Novo Cliente</h2>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>
          <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Nome completo *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">CPF *</label>
              <input required value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Telefone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">E-mail</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Data de nascimento</label>
              <input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Profissão</label>
              <input value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Endereço</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 flex items-center gap-1.5 text-sm font-medium"><Lock className="h-3.5 w-3.5" /> Senha GOV.BR</label>
              <input type="password" value={form.gov_password} onChange={(e) => setForm({ ...form, gov_password: e.target.value })} placeholder="Senha de acesso ao GOV.BR" className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Observações</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-input px-4 py-2 text-sm hover:bg-muted transition-colors">Cancelar</button>
              <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">Salvar</button>
            </div>
          </form>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input type="text" placeholder="Buscar por nome, CPF ou e-mail..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 w-full max-w-md rounded-lg border border-input bg-card pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {clients.length === 0 ? 'Nenhum cliente cadastrado. Clique em "Novo Cliente" para começar.' : "Nenhum resultado encontrado."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((client) => {
            const decCount = declarations.filter((d) => d.client_id === client.id).length;
            const initials = client.name.split(" ").map((n) => n[0]).slice(0, 2).join("");
            const govPass = (client as any).gov_password;
            return (
              <div key={client.id} className="group rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-sm transition-all animate-fade-in">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{initials}</div>
                    <div>
                      <h3 className="font-semibold text-sm">{client.name}</h3>
                      <p className="text-xs text-muted-foreground">{client.cpf}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {client.phone && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Phone className="h-3.5 w-3.5" />{client.phone}</div>}
                  {client.email && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Mail className="h-3.5 w-3.5" />{client.email}</div>}
                  {govPass && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Lock className="h-3.5 w-3.5" />
                      <span>GOV.BR: </span>
                      <span className="font-mono">{showPasswords[client.id] ? govPass : "••••••••"}</span>
                      <button onClick={() => togglePassword(client.id)} className="hover:text-foreground transition-colors">
                        {showPasswords[client.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <div className="text-xs text-muted-foreground"><span className="font-medium text-foreground">{decCount}</span> declaração(ões)</div>
                  {client.profession && <span className="text-xs text-muted-foreground">{client.profession}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
