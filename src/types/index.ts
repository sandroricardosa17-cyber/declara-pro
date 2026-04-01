export type DeclarationStatus =
  | "aguardando_documentos"
  | "em_andamento"
  | "em_revisao"
  | "finalizada"
  | "enviada"
  | "em_processamento"
  | "processada"
  | "em_malha_fina";

export type DeclarationType = "completa" | "simplificada" | "complexa";

export type DeclarationResult = "a_restituir" | "a_pagar" | "sem_imposto";

export type PaymentMethod = "pix" | "cartao" | "dinheiro" | "transferencia";

export type PaymentStatus = "pendente" | "pago" | "parcial";

export type FiscalRisk = "baixo" | "medio" | "alto";

export type DocumentCategory =
  | "comprovantes_rendimentos"
  | "despesas_medicas"
  | "educacao"
  | "informes_bancarios"
  | "notas_fiscais"
  | "outros";

export interface Client {
  id: string;
  name: string;
  cpf: string;
  birthDate: string;
  phone: string;
  email: string;
  address: string;
  profession: string;
  notes: string;
  createdAt: string;
}

export interface Declaration {
  id: string;
  clientId: string;
  clientName: string;
  yearBase: number;
  exerciseYear: number;
  status: DeclarationStatus;
  type: DeclarationType;
  result?: DeclarationResult;
  resultValue?: number;
  installments?: number;
  sentDate?: string;
  processedDate?: string;
  refundBatch?: string;
  fiscalRisk: FiscalRisk;
  malhaFina: boolean;
  fee: number;
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
}

export const STATUS_CONFIG: Record<DeclarationStatus, { label: string; color: string }> = {
  aguardando_documentos: { label: "Aguardando Documentos", color: "bg-status-danger/10 text-status-danger" },
  em_andamento: { label: "Em Andamento", color: "bg-status-warning/10 text-status-warning" },
  em_revisao: { label: "Em Revisão", color: "bg-status-info/10 text-status-info" },
  finalizada: { label: "Finalizada", color: "bg-status-success/10 text-status-success" },
  enviada: { label: "Transmitida", color: "bg-primary/10 text-primary" },
  em_processamento: { label: "Em Processamento", color: "bg-status-info/10 text-status-info" },
  processada: { label: "Processada", color: "bg-status-success/10 text-status-success" },
  em_malha_fina: { label: "Em Malha Fina", color: "bg-status-danger/10 text-status-danger" },
};

export const RESULT_CONFIG: Record<DeclarationResult, { label: string; color: string }> = {
  a_restituir: { label: "A Restituir", color: "text-status-success" },
  a_pagar: { label: "A Pagar", color: "text-status-danger" },
  sem_imposto: { label: "Sem Imposto", color: "text-muted-foreground" },
};

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "bg-status-danger/10 text-status-danger" },
  pago: { label: "Pago", color: "bg-status-success/10 text-status-success" },
  parcial: { label: "Parcial", color: "bg-status-warning/10 text-status-warning" },
};

export const RISK_CONFIG: Record<FiscalRisk, { label: string; color: string }> = {
  baixo: { label: "Baixo", color: "bg-status-success/10 text-status-success" },
  medio: { label: "Médio", color: "bg-status-warning/10 text-status-warning" },
  alto: { label: "Alto", color: "bg-status-danger/10 text-status-danger" },
};
