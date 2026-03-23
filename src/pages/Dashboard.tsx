import { FileText, Users, DollarSign, AlertTriangle, Clock, CheckCircle, XCircle } from "lucide-react";
import MetricCard from "@/components/MetricCard";
import { StatusBadge, PaymentBadge, RiskBadge } from "@/components/StatusBadge";
import { mockDeclarations, mockClients } from "@/data/mock";
import { RESULT_CONFIG } from "@/types";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const currentYear = mockDeclarations.filter((d) => d.exerciseYear === 2025);
  const pending = currentYear.filter((d) => d.status === "aguardando_documentos").length;
  const inProgress = currentYear.filter((d) => ["em_andamento", "em_revisao"].includes(d.status)).length;
  const completed = currentYear.filter((d) => ["finalizada", "enviada", "em_processamento", "processada"].includes(d.status)).length;
  const totalRevenue = currentYear.reduce((sum, d) => sum + d.fee, 0);
  const received = currentYear.filter((d) => d.paymentStatus === "pago").reduce((sum, d) => sum + d.fee, 0);

  const alerts = [
    { icon: XCircle, message: "3 declarações sem documentos", type: "danger" as const },
    { icon: Clock, message: "2 clientes sem retorno há 7 dias", type: "warning" as const },
    { icon: DollarSign, message: "R$ 1.050,00 em cobranças pendentes", type: "warning" as const },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral do exercício 2025</p>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Declarações Pendentes" value={pending} icon={AlertTriangle} variant="danger" />
        <MetricCard title="Em Andamento" value={inProgress} icon={Clock} variant="warning" />
        <MetricCard title="Finalizadas" value={completed} icon={CheckCircle} variant="primary" />
        <MetricCard
          title="Total Faturado"
          value={`R$ ${totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          subtitle={`R$ ${received.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} recebido`}
          icon={DollarSign}
          trend={{ value: 12, positive: true }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Declarations */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-semibold">Declarações Recentes</h2>
            <Link to="/declaracoes" className="text-sm text-primary hover:underline">Ver todas</Link>
          </div>
          <div className="divide-y divide-border">
            {currentYear.slice(0, 5).map((dec) => (
              <div key={dec.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                    {dec.clientName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{dec.clientName}</p>
                    <p className="text-xs text-muted-foreground">IRPF {dec.yearBase}/{dec.exerciseYear} · {dec.type === "completa" ? "Completa" : "Simplificada"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {dec.result && (
                    <span className={`text-xs font-medium ${RESULT_CONFIG[dec.result].color}`}>
                      {dec.resultValue ? `R$ ${dec.resultValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : RESULT_CONFIG[dec.result].label}
                    </span>
                  )}
                  <StatusBadge status={dec.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-semibold">Alertas</h2>
          </div>
          <div className="space-y-1 p-3">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-lg p-3 ${
                  alert.type === "danger" ? "bg-status-danger/5" : "bg-status-warning/5"
                }`}
              >
                <alert.icon className={`h-4 w-4 shrink-0 ${alert.type === "danger" ? "text-status-danger" : "text-status-warning"}`} />
                <p className="text-sm">{alert.message}</p>
              </div>
            ))}
          </div>

          {/* Quick stats */}
          <div className="border-t border-border px-5 py-4">
            <h3 className="text-sm font-semibold mb-3">Clientes Ativos</h3>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{mockClients.length}</span>
              <span className="text-xs text-muted-foreground">clientes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
