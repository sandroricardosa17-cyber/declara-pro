import { useState } from "react";
import { mockDeclarations } from "@/data/mock";
import { StatusBadge, PaymentBadge, RiskBadge } from "@/components/StatusBadge";
import { RESULT_CONFIG, DeclarationStatus } from "@/types";
import { Search, Plus, Filter, FileText, AlertTriangle } from "lucide-react";

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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DeclarationStatus | "all">("all");

  const filtered = mockDeclarations.filter((d) => {
    const matchSearch = d.clientName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Declarações IRPF</h1>
          <p className="text-sm text-muted-foreground">{mockDeclarations.length} declarações registradas</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          Nova Declaração
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-64 rounded-lg border border-input bg-card pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
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
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Honorários</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Pagamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((dec) => (
                <tr key={dec.id} className="hover:bg-muted/30 transition-colors cursor-pointer">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                        {dec.clientName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <p className="font-medium">{dec.clientName}</p>
                        {dec.malhaFina && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-status-danger">
                            <AlertTriangle className="h-3 w-3" /> Malha Fina
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{dec.yearBase}/{dec.exerciseYear}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs">{dec.type === "completa" ? "Completa" : "Simplificada"}</span>
                  </td>
                  <td className="px-5 py-3.5"><StatusBadge status={dec.status} /></td>
                  <td className="px-5 py-3.5">
                    {dec.result ? (
                      <div>
                        <span className={`text-xs font-medium ${RESULT_CONFIG[dec.result].color}`}>
                          {RESULT_CONFIG[dec.result].label}
                        </span>
                        {dec.resultValue && (
                          <p className="text-xs text-muted-foreground">
                            R$ {dec.resultValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5"><RiskBadge risk={dec.fiscalRisk} /></td>
                  <td className="px-5 py-3.5 font-medium">
                    R$ {dec.fee.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-3.5"><PaymentBadge status={dec.paymentStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
