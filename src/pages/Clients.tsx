import { useState } from "react";
import { mockClients, mockDeclarations } from "@/data/mock";
import { Search, Plus, Phone, Mail, MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";

export default function Clients() {
  const [search, setSearch] = useState("");

  const filtered = mockClients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.cpf.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground">{mockClients.length} clientes cadastrados</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          Novo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nome, CPF ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full max-w-md rounded-lg border border-input bg-card pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Client Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((client) => {
          const declarations = mockDeclarations.filter((d) => d.clientId === client.id);
          const initials = client.name.split(" ").map((n) => n[0]).slice(0, 2).join("");

          return (
            <div key={client.id} className="group rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-sm transition-all animate-fade-in">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {initials}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{client.name}</h3>
                    <p className="text-xs text-muted-foreground">{client.cpf}</p>
                  </div>
                </div>
                <button className="rounded-lg p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted transition-all">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  {client.phone}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  {client.email}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{declarations.length}</span> declaração(ões)
                </div>
                <span className="text-xs text-muted-foreground">{client.profession}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
