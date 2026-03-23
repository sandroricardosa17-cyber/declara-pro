import { CheckCircle2, Circle, Clock } from "lucide-react";

const tasks = [
  { id: 1, client: "João Pedro Oliveira", task: "Receber documentos", done: false, due: "2025-03-20" },
  { id: 2, client: "João Pedro Oliveira", task: "Conferir dados", done: false, due: "2025-03-22" },
  { id: 3, client: "Ana Carolina Ferreira", task: "Solicitar informe bancário", done: false, due: "2025-03-18" },
  { id: 4, client: "Fernanda Costa Souza", task: "Revisar lançamentos", done: false, due: "2025-03-21" },
  { id: 5, client: "Maria Silva Santos", task: "Receber documentos", done: true, due: "2025-03-05" },
  { id: 6, client: "Maria Silva Santos", task: "Lançar informações", done: true, due: "2025-03-08" },
  { id: 7, client: "Maria Silva Santos", task: "Revisar", done: true, due: "2025-03-09" },
  { id: 8, client: "Maria Silva Santos", task: "Enviar declaração", done: true, due: "2025-03-10" },
];

export default function Tasks() {
  const pending = tasks.filter((t) => !t.done);
  const completed = tasks.filter((t) => t.done);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tarefas</h1>
        <p className="text-sm text-muted-foreground">Checklist de atividades por declaração</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <Clock className="h-4 w-4 text-status-warning" />
            <h2 className="font-semibold">Pendentes ({pending.length})</h2>
          </div>
          <div className="divide-y divide-border">
            {pending.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-5 py-3.5">
                <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{t.task}</p>
                  <p className="text-xs text-muted-foreground">{t.client} · Prazo: {new Date(t.due).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Completed */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <CheckCircle2 className="h-4 w-4 text-status-success" />
            <h2 className="font-semibold">Concluídas ({completed.length})</h2>
          </div>
          <div className="divide-y divide-border">
            {completed.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-5 py-3.5 opacity-60">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-status-success" />
                <div className="flex-1">
                  <p className="text-sm font-medium line-through">{t.task}</p>
                  <p className="text-xs text-muted-foreground">{t.client}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
