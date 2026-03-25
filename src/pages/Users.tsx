import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Users as UsersIcon, Mail, Lock, User, Shield, X } from "lucide-react";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: string;
}

export default function Users() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "funcionario">("funcionario");

  const fetchData = async () => {
    const [{ data: profilesData }, { data: rolesData }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
    ]);
    if (profilesData) setProfiles(profilesData);
    if (rolesData) setRoles(rolesData as UserRole[]);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getRoleLabel = (userId: string) => {
    const userRole = roles.find((r) => r.user_id === userId);
    if (!userRole) return "Usuário";
    return userRole.role === "admin" ? "Administrador" : "Funcionário";
  };

  const getRoleBadgeClass = (userId: string) => {
    const userRole = roles.find((r) => r.user_id === userId);
    if (!userRole || userRole.role !== "admin") return "bg-muted text-muted-foreground";
    return "bg-primary/10 text-primary";
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: { email, password, full_name: fullName, role },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Usuário criado com sucesso!" });
      setShowForm(false);
      setFullName("");
      setEmail("");
      setPassword("");
      setRole("funcionario");
      fetchData();
    } catch (error: any) {
      toast({ title: "Erro ao criar usuário", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuários</h1>
          <p className="text-sm text-muted-foreground">Gerencie os usuários do sistema</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Novo Usuário
        </button>
      </div>

      {/* Create User Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Criar Novo Usuário</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Nome completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nome do usuário"
                    required
                    className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    required
                    className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Função</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as "admin" | "funcionario")}
                    className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                  >
                    <option value="funcionario">Funcionário</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {loading ? "Criando..." : "Criar Usuário"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">E-mail</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Função</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Criado em</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr key={profile.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="px-4 py-3 text-sm font-medium">{profile.full_name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{profile.email || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeClass(profile.user_id)}`}>
                      {getRoleLabel(profile.user_id)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(profile.created_at).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
              {profiles.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Nenhum usuário cadastrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
