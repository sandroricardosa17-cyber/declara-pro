import { Users, DollarSign, AlertTriangle, Clock, CheckCircle, XCircle } from "lucide-react";
import MetricCard from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useClients, useDeclarations, usePayments } from "@/hooks/useData";
import { Link } from "react-router-dom";

const RESULT_LABELS: Record<string, { label: string; color: string }> = {
  a_restituir: { label: "A Restituir", color: "text-status-success" },
  a_pagar: { label: "A Pagar", color: "text-status-danger" },
  sem_imposto: { label: "Sem Imposto", color: "text-muted-foreground" },
};

export default function Dashboard() {
  const { data: clients = [] } = useClients();
  const { data: declarations = [] } = useDeclarations();
  const { data: payments = [] } = usePayments();

  const currentYear = declarations.filter((d) => d.exercise_year === new Date().getFullYear());
  const pending = currentYear.filter((d) => d.status === "aguardando_documentos").length;
  const inProgress = currentYear.filter((d) => ["em_andamento", "em_revisao"].includes(d.status)).length;
  const completed = currentYear.filter((d) => ["finalizada", "enviada", "em_processamento", "processada"].includes(d.status)).length;

  // Revenue from declaration fees (all declarations, not just current year)
  const totalRevenue = declarations.reduce((s, d) => s + Number((d as any).fee || 0), 0);
  const completedRevenue = declarations
    .filter((d) => ["finalizada", "enviada", "em_processamento", "processada"].includes(d.status))
    .reduce((s, d) => s + Number((d as any).fee || 0), 0);

  const noDocs = currentYear.filter((d) => d.status === "aguardando_documentos").length;
  const pendingPayments = payments.filter((p) => p.status === "pendente").reduce((s, p) => s + Number(p.amount || 0), 0);

  const alerts = [
    ...(noDocs > 0 ? [{ icon: XCircle, message: `${noDocs} declaração(ões) sem documentos`, type: "danger" as const }] : []),
    ...(pendingPayments > 0 ? [{ icon: DollarSign, message: `R$ ${pendingPayments.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} em cobranças pendentes`, type: "warning" as const }] : []),
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral do exercício {new Date().getFullYear()}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Declarações Pendentes" value={pending} icon={AlertTriangle} variant="danger" />
        <MetricCard title="Em Andamento" value={inProgress} icon={Clock} variant="warning" />
        <MetricCard title="Finalizadas" value={completed} icon={CheckCircle} variant="primary" />
        <MetricCard
          title="Total Faturado"
          value={`R$ ${totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          subtitle={`R$ ${completedRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} concluído`}
          icon={DollarSign}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-semibold">Declarações Recentes</h2>
            <Link to="/declaracoes" className="text-sm text-primary hover:underline">Ver todas</Link>
          </div>
          <div className="divide-y divide-border">
            {declarations.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                Nenhuma declaração cadastrada. Comece adicionando clientes e declarações.
              </div>
            ) : (
              declarations.slice(0, 5).map((dec) => {
                const clientName = (dec as any).clients?.name || "—";
                const initials = clientName.split(" ").map((n: string) => n[0]).slice(0, 2).join("");
                return (
                  <div key={dec.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                        {initials}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{clientName}</p>
                        <p className="text-xs text-muted-foreground">IRPF {dec.year_base}/{dec.exercise_year} · {dec.type === "completa" ? "Completa" : "Simplificada"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {dec.result && dec.result_value && (
                        <span className={`text-xs font-medium ${RESULT_LABELS[dec.result]?.color || ""}`}>
                          R$ {Number(dec.result_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      )}
                      <StatusBadge status={dec.status} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-semibold">Alertas</h2>
          </div>
          {alerts.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum alerta no momento 🎉</div>
          ) : (
            <div className="space-y-1 p-3">
              {alerts.map((alert, i) => (
                <div key={i} className={`flex items-center gap-3 rounded-lg p-3 ${alert.type === "danger" ? "bg-status-danger/5" : "bg-status-warning/5"}`}>
                  <alert.icon className={`h-4 w-4 shrink-0 ${alert.type === "danger" ? "text-status-danger" : "text-status-warning"}`} />
                  <p className="text-sm">{alert.message}</p>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-border px-5 py-4">
            <h3 className="text-sm font-semibold mb-3">Clientes Ativos</h3>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{clients.length}</span>
              <span className="text-xs text-muted-foreground">clientes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
