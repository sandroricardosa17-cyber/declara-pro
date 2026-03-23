import { STATUS_CONFIG, DeclarationStatus, PAYMENT_STATUS_CONFIG, PaymentStatus, RISK_CONFIG, FiscalRisk } from "@/types";

export function StatusBadge({ status }: { status: DeclarationStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const config = PAYMENT_STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}

export function RiskBadge({ risk }: { risk: FiscalRisk }) {
  const config = RISK_CONFIG[risk];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}
