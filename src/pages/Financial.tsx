import { usePayments } from "@/hooks/useData";
import { DollarSign, Clock, CheckCircle } from "lucide-react";
import MetricCard from "@/components/MetricCard";
import { PaymentBadge } from "@/components/StatusBadge";

export default function Financial() {
  const { data: payments = [], isLoading } = usePayments();

  const totalFee = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const received = payments.filter((p) => p.status === "pago").reduce((s, p) => s + Number(p.amount || 0), 0);
  const pending = totalFee - received;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <p className="text-sm text-muted-foreground">Controle de honorários e pagamentos</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Total Faturado" value={`R$ ${totalFee.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={DollarSign} />
        <MetricCard title="Recebido" value={`R$ ${received.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={CheckCircle} variant="primary" />
        <MetricCard title="A Receber" value={`R$ ${pending.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={Clock} variant="warning" />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold">Detalhamento por Pagamento</h2>
        </div>
        {isLoading ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : payments.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">Nenhum pagamento registrado.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Cliente</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Valor</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Forma</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payments.map((p) => {
                const clientName = (p as any).declarations?.clients?.name || "—";
                return (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5 font-medium">{clientName}</td>
                    <td className="px-5 py-3.5 font-medium">R$ {Number(p.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    <td className="px-5 py-3.5 text-muted-foreground capitalize">{p.payment_method || "—"}</td>
                    <td className="px-5 py-3.5"><PaymentBadge status={p.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
