import { useRef } from "react";
import { useDeclarations, usePayments } from "@/hooks/useData";
import { FileText, AlertTriangle, DollarSign, Clock, CheckCircle, TrendingUp, Users, Download } from "lucide-react";
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
  const printRef = useRef<HTMLDivElement>(null);

  const total = declarations.length;
  const malhaFina = declarations.filter((d) => d.status === "em_malha_fina" || d.malha_fina).length;
  const pendentes = declarations.filter((d) => ["aguardando_documentos", "em_andamento", "em_revisao"].includes(d.status)).length;
  const finalizadas = declarations.filter((d) => ["finalizada", "enviada", "em_processamento", "processada"].includes(d.status)).length;

  const totalFee = declarations.reduce((s, d) => s + Number((d as any).fee || 0), 0);

  const totalPaid = payments.filter((p) => p.status === "pago").reduce((s, p) => s + Number(p.amount || 0), 0);
  const totalCommission = totalPaid * 0.1;
  const totalPending = Math.max(totalFee - totalPaid, 0);
  const pendingCount = declarations.filter((d) => {
    const fee = Number((d as any).fee || 0);
    const paid = payments.filter((p) => p.declaration_id === d.id && p.status === "pago").reduce((s, p) => s + Number(p.amount || 0), 0);
    return paid < fee;
  }).length;

  const restituir = declarations.filter((d) => d.result === "a_restituir");
  const aPagar = declarations.filter((d) => d.result === "a_pagar");
  const semImposto = declarations.filter((d) => d.result === "sem_imposto");

  const totalRestituir = restituir.reduce((s, d) => s + Number(d.result_value || 0), 0);
  const totalAPagar = aPagar.reduce((s, d) => s + Number(d.result_value || 0), 0);

  const byType = Object.entries(
    declarations.reduce((acc, d) => {
      acc[d.type] = (acc[d.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  );

  const byCollaborator = Object.entries(
    declarations.reduce((acc, d) => {
      const name = (d as any).collaborator_name || "Não atribuído";
      if (!acc[name]) acc[name] = { count: 0, fee: 0, received: 0 };
      acc[name].count++;
      acc[name].fee += Number((d as any).fee || 0);
      acc[name].received += payments
        .filter((p) => p.declaration_id === d.id && p.status === "pago")
        .reduce((s, p) => s + Number(p.amount || 0), 0);
      return acc;
    }, {} as Record<string, { count: number; fee: number; received: number }>)
  );

  const handleDownloadPDF = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório IRPF - ${new Date().toLocaleDateString("pt-BR")}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; padding: 32px; font-size: 12px; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          h2 { font-size: 14px; margin-bottom: 8px; border-bottom: 1px solid #e5e5e5; padding-bottom: 6px; }
          .subtitle { color: #666; font-size: 11px; margin-bottom: 24px; }
          .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
          .metric { border: 1px solid #e5e5e5; border-radius: 8px; padding: 12px; }
          .metric-title { color: #666; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
          .metric-value { font-size: 18px; font-weight: 700; margin-top: 4px; }
          .section { margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th { text-align: left; padding: 8px; border-bottom: 2px solid #e5e5e5; color: #666; font-weight: 600; font-size: 10px; text-transform: uppercase; }
          td { padding: 8px; border-bottom: 1px solid #f0f0f0; }
          tr:nth-child(even) { background: #fafafa; }
          .text-success { color: #16a34a; }
          .text-danger { color: #dc2626; }
          .text-primary { color: #166534; }
          .text-muted { color: #999; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
          .card { border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden; }
          .card-header { padding: 10px 14px; border-bottom: 1px solid #e5e5e5; font-weight: 600; font-size: 12px; background: #fafafa; }
          .card-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 14px; border-bottom: 1px solid #f5f5f5; }
          .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 6px; }
          .dot-green { background: #16a34a; }
          .dot-red { background: #dc2626; }
          .dot-gray { background: #999; }
          .footer { margin-top: 32px; text-align: center; color: #999; font-size: 10px; border-top: 1px solid #e5e5e5; padding-top: 12px; }
          @media print { body { padding: 16px; } }
        </style>
      </head>
      <body>
        <h1>Relatório de Declarações IRPF</h1>
        <p class="subtitle">Gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>

        <div class="metrics">
          <div class="metric"><div class="metric-title">Total Declarações</div><div class="metric-value">${total}</div></div>
          <div class="metric"><div class="metric-title">Em Malha Fina</div><div class="metric-value text-danger">${malhaFina}</div></div>
          <div class="metric"><div class="metric-title">Pendentes</div><div class="metric-value">${pendentes}</div></div>
          <div class="metric"><div class="metric-title">Processadas</div><div class="metric-value text-success">${finalizadas}</div></div>
        </div>

        <div class="metrics">
          <div class="metric"><div class="metric-title">Valor Total Honorários</div><div class="metric-value">R$ ${totalFee.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div></div>
          <div class="metric"><div class="metric-title">Recebido</div><div class="metric-value text-success">R$ ${totalPaid.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div></div>
          <div class="metric"><div class="metric-title">A Receber</div><div class="metric-value">R$ ${totalPending.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div></div>
          <div class="metric"><div class="metric-title">Total Comissões (10%)</div><div class="metric-value text-primary">R$ ${totalCommission.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div></div>
        </div>

        <div class="grid-2">
          <div class="card">
            <div class="card-header">Resultado das Declarações</div>
            <div class="card-row"><span><span class="dot dot-green"></span>A Restituir</span><span>${restituir.length} — <span class="text-success">R$ ${totalRestituir.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></span></div>
            <div class="card-row"><span><span class="dot dot-red"></span>A Pagar</span><span>${aPagar.length} — <span class="text-danger">R$ ${totalAPagar.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></span></div>
            <div class="card-row"><span><span class="dot dot-gray"></span>Sem Imposto</span><span>${semImposto.length}</span></div>
            <div class="card-row"><span><span class="dot dot-gray"></span>Sem resultado</span><span>${total - restituir.length - aPagar.length - semImposto.length}</span></div>
          </div>
          <div class="card">
            <div class="card-header">Por Tipo de Declaração</div>
            ${byType.map(([type, count]) => `<div class="card-row"><span>${TYPE_LABELS[type] || type}</span><span>${count}</span></div>`).join("")}
          </div>
        </div>

        <div class="section">
          <h2>Comissões por Colaborador (10%)</h2>
          <table>
            <thead><tr><th>Colaborador</th><th>Declarações</th><th>Honorários</th><th>Recebido</th><th>Comissão (10%)</th></tr></thead>
            <tbody>
              ${byCollaborator.map(([name, data]) => `
                <tr>
                  <td>${name}</td>
                  <td>${data.count}</td>
                  <td>R$ ${data.fee.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                  <td class="text-success">R$ ${data.received.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                  <td class="text-primary">R$ ${(data.received * 0.1).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Detalhamento Individual</h2>
          <table>
            <thead><tr><th>Cliente</th><th>Ano</th><th>Tipo</th><th>Status</th><th>Resultado</th><th>Valor</th><th>Parcelas</th><th>Honorário</th><th>Malha</th></tr></thead>
            <tbody>
              ${declarations.map((dec) => {
                const clientName = (dec as any).clients?.name || "—";
                const resultLabel = dec.result ? RESULT_LABELS[dec.result] : "—";
                const resultClass = dec.result === "a_restituir" ? "text-success" : dec.result === "a_pagar" ? "text-danger" : "text-muted";
                return `<tr>
                  <td>${clientName}</td>
                  <td>${dec.year_base}/${dec.exercise_year}</td>
                  <td>${TYPE_LABELS[dec.type] || dec.type}</td>
                  <td>${dec.status.replace(/_/g, " ")}</td>
                  <td class="${resultClass}">${resultLabel}</td>
                  <td>${dec.result_value ? `R$ ${Number(dec.result_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}</td>
                  <td>${dec.result === "a_pagar" && (dec as any).tax_installments ? `${(dec as any).tax_installments}x` : "—"}</td>
                  <td>R$ ${Number((dec as any).fee || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                  <td>${dec.malha_fina ? "⚠ Sim" : "Não"}</td>
                </tr>`;
              }).join("")}
            </tbody>
          </table>
        </div>

        <div class="footer">Relatório gerado automaticamente pelo sistema DeclaraPro</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  if (isLoading) return <div className="text-center py-12 text-muted-foreground text-sm">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Visão consolidada de declarações e financeiro</p>
        </div>
        <button
          onClick={handleDownloadPDF}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Download className="h-4 w-4" /> Baixar PDF
        </button>
      </div>

      <div ref={printRef}>
        {/* Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <MetricCard title="Total Declarações" value={total} icon={FileText} />
          <MetricCard title="Em Malha Fina" value={malhaFina} icon={AlertTriangle} variant="danger" />
          <MetricCard title="Pendentes" value={pendentes} icon={Clock} variant="warning" />
          <MetricCard title="Processadas" value={finalizadas} icon={CheckCircle} variant="primary" />
        </div>

        {/* Financial summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <MetricCard title="Valor Total Honorários" value={`R$ ${totalFee.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={DollarSign} />
          <MetricCard title="Recebido" value={`R$ ${totalPaid.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={CheckCircle} variant="primary" />
          <MetricCard title="A Receber" value={`R$ ${totalPending.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} subtitle={`${pendingCount} pendente(s)`} icon={Clock} variant="warning" />
          <MetricCard title="Total Comissões (10%)" value={`R$ ${totalCommission.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={TrendingUp} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-6">
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

        {/* Collaborators */}
        <div className="rounded-xl border border-border bg-card mb-6">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-semibold flex items-center gap-2"><Users className="h-4 w-4" /> Comissões por Colaborador (10%)</h2>
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
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Recebido</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Comissão (10%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {byCollaborator.map(([name, data]) => (
                  <tr key={name} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5 font-medium">{name}</td>
                    <td className="px-5 py-3.5">{data.count}</td>
                    <td className="px-5 py-3.5">R$ {data.fee.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    <td className="px-5 py-3.5 text-status-success">R$ {data.received.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    <td className="px-5 py-3.5 font-medium text-primary">R$ {(data.received * 0.1).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Individual detail */}
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
    </div>
  );
}
