import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import { Bell, Search } from "lucide-react";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-8 backdrop-blur-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar clientes, declarações..."
              className="h-9 w-80 rounded-lg border border-input bg-background pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-status-danger" />
            </button>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                AC
              </div>
              <div className="text-sm">
                <p className="font-medium">Admin</p>
                <p className="text-xs text-muted-foreground">Contador</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
