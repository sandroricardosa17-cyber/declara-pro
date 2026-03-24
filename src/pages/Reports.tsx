import { useDeclarations, usePayments } from "@/hooks/useData";
import { FileText, AlertTriangle, DollarSign, Clock, CheckCircle, TrendingUp, Users } from "lucide-react";
import MetricCard from "@/components/MetricCard";

const RESULT_LABELS: Record<string, string> = {
  a_restituir: "A Restituir",
  a_pagar: "A Pagar",
  sem_imposto: "Sem Imposto",
};

const TYPE_LABELS: Record<string, string> = {
  simplificada: "Simplificada",
  completa: "Completa",
  complexa: "Complexa",
};

export default function Reports() {
  const { data: declarations = [], isLoading } = useDeclarations();
  const { data: payments = [] } = usePayments();

  const total = declarations.length;
  const malhaFina = declarations.filter((d) => d.malha_fina).length;
  const pendentes = declarations.filter((d) => ["aguardando_documentos", "em_andamento", "em_revisao"].includes(d.status)).length;
  const finalizadas = declarations.filter((d) => ["finalizada", "enviada", "em_processamento", "processada"].includes(d.status)).length;

  const totalFee = declarations.reduce((s, d) => s + Number((d as any).fee || 0), 0);
  const totalCommission = totalFee * 0.2;

  const totalPaid = payments.filter((p) => p.status === "pago").reduce((s, p) => s + Number(p.amount || 0), 0);
  const totalPending = payments.filter((p) => p.status !== "pago").reduce((s, p) => s + Number(p.amount || 0), 0);
  const pendingCount = payments.filter((p) => p.status !== "pago").length;

  const restituir = declarations.filter((d) => d.result === "a_restituir");
  const aPagar = declarations.filter((d) => d.result === "a_pagar");
  const semImposto = declarations.filter((d) => d.result === "sem_imposto");

  const totalRestituir = restituir.reduce((s, d) => s + Number(d.result_value || 0), 0);
  const totalAPagar = aPagar.reduce((s, d) => s + Number(d.result_value || 0), 0);

  // Group by type
  const byType = Object.entries(
    declarations.reduce((acc, d) => {
      acc[d.type] = (acc[d.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  );

  // Group by collaborator
  const byCollaborator = Object.entries(
    declarations.reduce((acc, d) => {
      const name = (d as any).collaborator_name || "Não atribuído";
      if (!acc[name]) acc[name] = { count: 0, fee: 0 };
      acc[name].count++;
      acc[name].fee += Number((d as any).fee || 0);
      return acc;
    }, {} as Record<string, { count: number; fee: number }>)
  );

  if (isLoading) return <div className="text-center py-12 text-muted-foreground text-sm">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Visão consolidada de declarações e financeiro</p>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Declarações" value={total} icon={FileText} />
        <MetricCard title="Em Malha Fina" value={malhaFina} icon={AlertTriangle} variant="danger" />
        <MetricCard title="Pendentes" value={pendentes} icon={Clock} variant="warning" />
        <MetricCard title="Finalizadas" value={finalizadas} icon={CheckCircle} variant="primary" />
      </div>

      {/* Financial summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Valor Total Honorários" value={`R$ ${totalFee.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={DollarSign} />
        <MetricCard title="Recebido" value={`R$ ${totalPaid.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={CheckCircle} variant="primary" />
        <MetricCard title="A Receber" value={`R$ ${totalPending.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} subtitle={`${pendingCount} pendente(s)`} icon={Clock} variant="warning" />
        <MetricCard title="Total Comissões (20%)" value={`R$ ${totalCommission.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={TrendingUp} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Result breakdown */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-semibold">Resultado das Declarações</h2>
          </div>
          <div className="divide-y divide-border">
            <div className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-status-success" />
                <span className="text-sm">A Restituir</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{restituir.length} declaração(ões)</p>
                <p className="text-xs text-status-success">R$ {totalRestituir.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-status-danger" />
                <span className="text-sm">A Pagar</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{aPagar.length} declaração(ões)</p>
                <p className="text-xs text-status-danger">R$ {totalAPagar.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-muted-foreground" />
                <span className="text-sm">Sem Imposto</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{semImposto.length} declaração(ões)</p>
              </div>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-muted" />
                <span className="text-sm">Sem resultado definido</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{total - restituir.length - aPagar.length - semImposto.length} declaração(ões)</p>
              </div>
            </div>
          </div>
        </div>

        {/* By type */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-semibold">Por Tipo de Declaração</h2>
          </div>
          <div className="divide-y divide-border">
            {byType.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhuma declaração.</div>
            ) : (
              byType.map(([type, count]) => (
                <div key={type} className="flex items-center justify-between px-5 py-3.5">
                  <span className="text-sm font-medium">{TYPE_LABELS[type] || type}</span>
                  <span className="text-sm font-semibold">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Collaborators / commission detail */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold flex items-center gap-2"><Users className="h-4 w-4" /> Comissões por Colaborador (20%)</h2>
        </div>
        {byCollaborator.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhuma declaração.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Colaborador</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Declarações</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Honorários</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Comissão (20%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {byCollaborator.map(([name, data]) => (
                <tr key={name} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3.5 font-medium">{name}</td>
                  <td className="px-5 py-3.5">{data.count}</td>
                  <td className="px-5 py-3.5">R$ {data.fee.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                  <td className="px-5 py-3.5 font-medium text-primary">R$ {(data.fee * 0.2).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Individual declarations detail */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold">Detalhamento Individual</h2>
        </div>
        {declarations.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhuma declaração.</div>
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
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Valor</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Parcelas</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Honorário</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Malha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {declarations.map((dec) => {
                  const clientName = (dec as any).clients?.name || "—";
                  return (
                    <tr key={dec.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5 font-medium">{clientName}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">{dec.year_base}/{dec.exercise_year}</td>
                      <td className="px-5 py-3.5">{TYPE_LABELS[dec.type] || dec.type}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                          {dec.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className={`px-5 py-3.5 text-xs font-medium ${dec.result === "a_restituir" ? "text-status-success" : dec.result === "a_pagar" ? "text-status-danger" : "text-muted-foreground"}`}>
                        {dec.result ? RESULT_LABELS[dec.result] : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        {dec.result_value ? `R$ ${Number(dec.result_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {dec.result === "a_pagar" && (dec as any).tax_installments ? `${(dec as any).tax_installments}x` : "—"}
                      </td>
                      <td className="px-5 py-3.5 font-medium">R$ {Number((dec as any).fee || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-3.5">
                        {dec.malha_fina ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-status-danger"><AlertTriangle className="h-3 w-3" /> Sim</span>
                        ) : <span className="text-xs text-muted-foreground">Não</span>}
                      </td>
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
