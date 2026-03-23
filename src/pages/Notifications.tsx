import { Bell, FileText, DollarSign, MessageSquare } from "lucide-react";

const notifications = [
  { id: 1, type: "document", icon: FileText, message: "Ana Carolina Ferreira: falta informe bancário", time: "Há 2 horas", read: false },
  { id: 2, type: "payment", icon: DollarSign, message: "Cobrança pendente: Fernanda Costa Souza (R$ 300,00)", time: "Há 5 horas", read: false },
  { id: 3, type: "status", icon: Bell, message: "Declaração de Carlos Eduardo Lima enviada com sucesso", time: "Há 1 dia", read: true },
  { id: 4, type: "message", icon: MessageSquare, message: "João Pedro Oliveira respondeu no WhatsApp", time: "Há 2 dias", read: true },
];

export default function Notifications() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notificações</h1>
        <p className="text-sm text-muted-foreground">Alertas e comunicações recentes</p>
      </div>

      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {notifications.map((n) => (
          <div key={n.id} className={`flex items-start gap-4 px-5 py-4 ${!n.read ? "bg-primary/3" : ""}`}>
            <div className={`mt-0.5 rounded-lg p-2 ${!n.read ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
              <n.icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className={`text-sm ${!n.read ? "font-medium" : ""}`}>{n.message}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
            </div>
            {!n.read && <span className="mt-2 h-2 w-2 rounded-full bg-primary shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  );
}
