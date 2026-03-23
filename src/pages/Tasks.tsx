import { useTasks } from "@/hooks/useData";
import { CheckCircle2, Circle, Clock } from "lucide-react";

export default function Tasks() {
  const { data: tasks = [], isLoading } = useTasks();

  const pending = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tarefas</h1>
        <p className="text-sm text-muted-foreground">Checklist de atividades por declaração</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-sm text-muted-foreground">Carregando...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">Nenhuma tarefa cadastrada.</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <Clock className="h-4 w-4 text-status-warning" />
              <h2 className="font-semibold">Pendentes ({pending.length})</h2>
            </div>
            <div className="divide-y divide-border">
              {pending.length === 0 ? (
                <div className="px-5 py-6 text-center text-sm text-muted-foreground">Todas as tarefas concluídas!</div>
              ) : pending.map((t) => {
                const clientName = (t as any).declarations?.clients?.name || "";
                return (
                  <div key={t.id} className="flex items-center gap-3 px-5 py-3.5">
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{t.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {clientName}{t.due_date ? ` · Prazo: ${new Date(t.due_date).toLocaleDateString("pt-BR")}` : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <CheckCircle2 className="h-4 w-4 text-status-success" />
              <h2 className="font-semibold">Concluídas ({completed.length})</h2>
            </div>
            <div className="divide-y divide-border">
              {completed.length === 0 ? (
                <div className="px-5 py-6 text-center text-sm text-muted-foreground">Nenhuma tarefa concluída ainda.</div>
              ) : completed.map((t) => {
                const clientName = (t as any).declarations?.clients?.name || "";
                return (
                  <div key={t.id} className="flex items-center gap-3 px-5 py-3.5 opacity-60">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-status-success" />
                    <div className="flex-1">
                      <p className="text-sm font-medium line-through">{t.title}</p>
                      <p className="text-xs text-muted-foreground">{clientName}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
