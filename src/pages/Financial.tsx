import { useState } from "react";
import { useDeclarations, usePayments } from "@/hooks/useData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Clock, CheckCircle, Users, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import MetricCard from "@/components/MetricCard";
import { PaymentBadge } from "@/components/StatusBadge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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

const STATUS_CYCLE: Array<"pendente" | "parcial" | "pago"> = ["pendente", "parcial", "pago"];

export default function Financial() {
  const { data: declarations = [], isLoading: loadingDec } = useDeclarations();
  const { data: payments = [], isLoading: loadingPay } = usePayments();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isLoading = loadingDec || loadingPay;

  const [editingPaid, setEditingPaid] = useState<string | null>(null);
  
  const [paidValue, setPaidValue] = useState("");
  

  const totalFee = declarations.reduce((s, d) => s + Number(d.fee || 0), 0);
  const received = payments
    .filter((p) => p.status === "pago")
    .reduce((s, p) => s + Number(p.amount || 0), 0);
  const partial = payments
    .filter((p) => p.status === "parcial")
    .reduce((s, p) => s + Number(p.amount || 0), 0);
  const pending = totalFee - received - partial;

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
    const pendingPayment = decPayments.find((p) => p.status === "pendente" || p.status === "parcial");
    const dueDate = pendingPayment?.due_date || null;
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
      dueDate,
      pendingPaymentId: pendingPayment?.id || null,
      lastPaymentId: lastPayment?.id || null,
    };
  });

  const handleSetDueDate = async (row: typeof rows[0], date: Date | undefined) => {
    if (!user || !date) return;
    const dueDateStr = format(date, "yyyy-MM-dd");
    if (row.pendingPaymentId) {
      const { error } = await supabase
        .from("payments")
        .update({ due_date: dueDateStr } as any)
        .eq("id", row.pendingPaymentId);
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
        return;
      }
    } else {
      const { error } = await supabase.from("payments").insert({
        user_id: user.id,
        declaration_id: row.id,
        amount: row.remaining,
        status: "pendente",
        due_date: dueDateStr,
      } as any);
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
        return;
      }
    }
    toast({ title: "Data de pagamento definida!" });
    queryClient.invalidateQueries({ queryKey: ["payments"] });
  };

  const handleToggleStatus = async (row: typeof rows[0]) => {
    if (!user) return;
    const currentIndex = STATUS_CYCLE.indexOf(row.paymentStatus);
    const nextStatus = STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length];

    if (row.pendingPaymentId || row.lastPaymentId) {
      const paymentId = row.pendingPaymentId || row.lastPaymentId;
      const updateData: any = { status: nextStatus };
      if (nextStatus === "pago") {
        updateData.paid_at = new Date().toISOString();
      } else {
        updateData.paid_at = null;
      }
      const { error } = await supabase
        .from("payments")
        .update(updateData)
        .eq("id", paymentId);
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
        return;
      }
    } else {
      const { error } = await supabase.from("payments").insert({
        user_id: user.id,
        declaration_id: row.id,
        amount: row.fee,
        status: nextStatus,
        paid_at: nextStatus === "pago" ? new Date().toISOString() : null,
      } as any);
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
        return;
      }
    }
    toast({ title: `Status alterado para ${nextStatus}` });
    queryClient.invalidateQueries({ queryKey: ["payments"] });
  };

  const handleSavePaid = async (row: typeof rows[0]) => {
    if (!user) return;
    const val = parseFloat(paidValue.replace(",", "."));
    if (isNaN(val) || val < 0) {
      toast({ title: "Valor inválido", variant: "destructive" });
      setEditingPaid(null);
      return;
    }
    const newStatus = val >= row.fee && row.fee > 0 ? "pago" : val > 0 ? "parcial" : "pendente";

    if (row.lastPaymentId) {
      const { error } = await supabase
        .from("payments")
        .update({ amount: val, status: newStatus, paid_at: newStatus === "pago" ? new Date().toISOString() : null } as any)
        .eq("id", row.lastPaymentId);
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      }
    } else {
      const { error } = await supabase.from("payments").insert({
        user_id: user.id,
        declaration_id: row.id,
        amount: val,
        status: newStatus,
        paid_at: newStatus === "pago" ? new Date().toISOString() : null,
      } as any);
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      }
    }
    setEditingPaid(null);
    queryClient.invalidateQueries({ queryKey: ["payments"] });
  };




  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <p className="text-sm text-muted-foreground">
          Controle de honorários e pagamentos · {declarations.length} declarações
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Honorários" value={`R$ ${totalFee.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={DollarSign} />
        <MetricCard title="Recebido" value={`R$ ${received.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={CheckCircle} variant="primary" />
        <MetricCard title="Parcial" value={`R$ ${partial.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={Users} />
        <MetricCard title="A Receber" value={`R$ ${(pending > 0 ? pending : 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={Clock} variant="warning" />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold">Detalhamento por Declaração</h2>
        </div>
        {isLoading ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">Nenhuma declaração registrada.</div>
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
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Previsão Pgto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5 font-medium">{r.clientName}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{r.yearBase}/{r.exerciseYear}</td>
                    <td className="px-5 py-3.5 text-xs font-medium">{TYPE_LABELS[r.type] || r.type}</td>
                    <td className="px-5 py-3.5 font-medium">R$ {r.fee.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    <td className="px-5 py-3.5">
                      {editingPaid === r.id ? (
                        <Input
                          autoFocus
                          className="h-7 w-28 text-xs"
                          defaultValue={r.paidAmount.toFixed(2).replace(".", ",")}
                          onBlur={(e) => { setPaidValue(e.target.value); handleSavePaid(r); }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              setPaidValue((e.target as HTMLInputElement).value);
                              setTimeout(() => handleSavePaid(r), 0);
                            }
                            if (e.key === "Escape") setEditingPaid(null);
                          }}
                          onChange={(e) => setPaidValue(e.target.value)}
                        />
                      ) : (
                        <button
                          className="font-medium text-status-success hover:underline cursor-pointer"
                          onClick={() => { setEditingPaid(r.id); setPaidValue(r.paidAmount.toFixed(2).replace(".", ",")); }}
                        >
                          R$ {r.paidAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-status-danger">
                      R$ {r.remaining.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground capitalize">
                      {r.paymentMethod ? PAYMENT_METHOD_LABELS[r.paymentMethod] || r.paymentMethod : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => handleToggleStatus(r)} className="cursor-pointer">
                        <PaymentBadge status={r.paymentStatus} />
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      {r.paymentStatus === "pago" ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className={cn("inline-flex items-center gap-1.5 rounded-md border border-input px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors", r.dueDate ? "text-foreground" : "text-muted-foreground")}>
                              <CalendarIcon className="h-3 w-3" />
                              {r.dueDate ? format(new Date(r.dueDate + "T00:00:00"), "dd/MM/yyyy") : "Definir data"}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={r.dueDate ? new Date(r.dueDate + "T00:00:00") : undefined} onSelect={(date) => handleSetDueDate(r, date)} locale={ptBR} initialFocus className={cn("p-3 pointer-events-auto")} />
                          </PopoverContent>
                        </Popover>
                      )}
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
