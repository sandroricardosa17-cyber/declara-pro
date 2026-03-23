import { mockDeclarations } from "@/data/mock";
import { DollarSign, TrendingUp, Clock, CheckCircle } from "lucide-react";
import MetricCard from "@/components/MetricCard";
import { PaymentBadge } from "@/components/StatusBadge";

export default function Financial() {
  const current = mockDeclarations.filter((d) => d.exerciseYear === 2025);
  const totalFee = current.reduce((s, d) => s + d.fee, 0);
  const received = current.filter((d) => d.paymentStatus === "pago").reduce((s, d) => s + d.fee, 0);
  const pending = totalFee - received;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <p className="text-sm text-muted-foreground">Controle de honorários e pagamentos</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Total Faturado" value={`R$ ${totalFee.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={DollarSign} variant="default" />
        <MetricCard title="Recebido" value={`R$ ${received.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={CheckCircle} variant="primary" />
        <MetricCard title="A Receber" value={`R$ ${pending.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={Clock} variant="warning" />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold">Detalhamento por Declaração</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-5 py-3 text-left font-medium text-muted-foreground">Cliente</th>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground">Ano</th>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground">Honorários</th>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground">Forma</th>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {current.map((dec) => (
              <tr key={dec.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3.5 font-medium">{dec.clientName}</td>
                <td className="px-5 py-3.5 text-muted-foreground">{dec.yearBase}/{dec.exerciseYear}</td>
                <td className="px-5 py-3.5 font-medium">R$ {dec.fee.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                <td className="px-5 py-3.5 text-muted-foreground capitalize">{dec.paymentMethod || "—"}</td>
                <td className="px-5 py-3.5"><PaymentBadge status={dec.paymentStatus} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
