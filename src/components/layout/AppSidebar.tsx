import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Users, FileText, DollarSign, ClipboardList,
  Bell, Settings, LogOut, Receipt, BarChart3, UserPlus,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Clientes", icon: Users, path: "/clientes" },
  { label: "Declarações", icon: FileText, path: "/declaracoes" },
  { label: "Financeiro", icon: DollarSign, path: "/financeiro" },
  { label: "Relatórios", icon: BarChart3, path: "/relatorios" },
  { label: "Tarefas", icon: ClipboardList, path: "/tarefas" },
  { label: "Notificações", icon: Bell, path: "/notificacoes" },
  { label: "Usuários", icon: UserPlus, path: "/usuarios" },
];

export default function AppSidebar() {
  const location = useLocation();
  const { signOut, user } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
          <Receipt className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-sidebar-accent-foreground">IRPF Control</h1>
          <p className="text-[10px] text-sidebar-foreground/60">Gestão de Declarações</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3 space-y-1">
        <Link
          to="/configuracoes"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <Settings className="h-4.5 w-4.5" />
          Configurações
        </Link>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="h-4.5 w-4.5" />
          Sair
        </button>
      </div>
    </aside>
  );
}
