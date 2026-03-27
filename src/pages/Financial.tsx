import { useDeclarations, usePayments } from "@/hooks/useData";
import { DollarSign, Clock, CheckCircle, Users } from "lucide-react";
import MetricCard from "@/components/MetricCard";
import { PaymentBadge } from "@/components/StatusBadge";

const TYPE_LABELS: Record<string, string> = {
  simplificada: "Simplificada",
  completa: "Completa",
  complexa: "Complexa",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: "PIX",
  cartao: "Cartão",
  dinheiro: "Dinheiro",
  transferencia: "Transferência",
};

export default function Financial() {
  const { data: declarations = [], isLoading: loadingDec } = useDeclarations();
  const { data: payments = [], isLoading: loadingPay } = usePayments();
  const isLoading = loadingDec || loadingPay;

  // Total fees from declarations
  const totalFee = declarations.reduce((s, d) => s + Number(d.fee || 0), 0);

  // Received from payments with status "pago"
  const received = payments
    .filter((p) => p.status === "pago")
    .reduce((s, p) => s + Number(p.amount || 0), 0);

  // Partial payments
  const partial = payments
    .filter((p) => p.status === "parcial")
    .reduce((s, p) => s + Number(p.amount || 0), 0);

  const pending = totalFee - received - partial;

  // Build a combined view: one row per declaration with payment info
  const rows = declarations.map((dec) => {
    const clientName = (dec as any).clients?.name || "—";
    const fee = Number(dec.fee || 0);
    const decPayments = payments.filter((p) => p.declaration_id === dec.id);
    const paidAmount = decPayments
      .filter((p) => p.status === "pago")
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    const paymentStatus: "pago" | "parcial" | "pendente" =
      paidAmount >= fee && fee > 0 ? "pago" : paidAmount > 0 ? "parcial" : "pendente";
    const lastPayment = decPayments.length > 0 ? decPayments[0] : null;
    return {
      id: dec.id,
      clientName,
      yearBase: dec.year_base,
      exerciseYear: dec.exercise_year,
      type: dec.type,
      fee,
      paidAmount,
      remaining: Math.max(fee - paidAmount, 0),
      paymentStatus,
      paymentMethod: lastPayment?.payment_method || null,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <p className="text-sm text-muted-foreground">
          Controle de honorários e pagamentos · {declarations.length} declarações
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Honorários"
          value={`R$ ${totalFee.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
        />
        <MetricCard
          title="Recebido"
          value={`R$ ${received.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          icon={CheckCircle}
          variant="primary"
        />
        <MetricCard
          title="Parcial"
          value={`R$ ${partial.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          icon={Users}
        />
        <MetricCard
          title="A Receber"
          value={`R$ ${(pending > 0 ? pending : 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          icon={Clock}
          variant="warning"
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold">Detalhamento por Declaração</h2>
        </div>
        {isLoading ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            Nenhuma declaração registrada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Cliente</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Ano</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Honorário</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Pago</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Restante</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Forma</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5 font-medium">{r.clientName}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {r.yearBase}/{r.exerciseYear}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-medium">
                      {TYPE_LABELS[r.type] || r.type}
                    </td>
                    <td className="px-5 py-3.5 font-medium">
                      R$ {r.fee.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-status-success">
                      R$ {r.paidAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-status-danger">
                      R$ {r.remaining.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground capitalize">
                      {r.paymentMethod
                        ? PAYMENT_METHOD_LABELS[r.paymentMethod] || r.paymentMethod
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <PaymentBadge status={r.paymentStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
