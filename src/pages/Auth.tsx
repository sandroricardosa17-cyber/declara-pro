import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Receipt, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ssoToken = params.get("sso_token");
    if (!ssoToken) return;

    window.history.replaceState({}, "", window.location.pathname);
    setSsoLoading(true);

    const handleSSO = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("sso-auto-login", {
          body: { token: ssoToken },
        });

        if (error || !data?.access_token) {
          console.error("SSO falhou:", error || data?.error);
          toast({
            title: "Erro no SSO",
            description: data?.error || "Falha na autenticação via Decole Hub",
            variant: "destructive",
          });
          setSsoLoading(false);
          return;
        }

        await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });

        navigate("/");
      } catch (err: any) {
        console.error("Erro SSO:", err);
        toast({
          title: "Erro no SSO",
          description: err.message || "Falha na autenticação via Decole Hub",
          variant: "destructive",
        });
        setSsoLoading(false);
      }
    };

    handleSSO();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const form = e.currentTarget as HTMLFormElement;
      const formData = new FormData(form);
      const submittedEmail = String(formData.get("email") ?? email).trim().toLowerCase();
      const submittedPassword = String(formData.get("password") ?? password);

      const { error } = await supabase.auth.signInWithPassword({
        email: submittedEmail,
        password: submittedPassword,
      });
      if (error) throw error;
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message === "Invalid login credentials"
          ? "E-mail ou senha inválidos."
          : error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (ssoLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <Receipt className="h-7 w-7 text-primary-foreground" />
          </div>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-medium">Conectando via Decole Hub...</p>
          <p className="text-sm text-muted-foreground">Aguarde enquanto validamos sua sessão</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <Receipt className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">IR Control</h1>
          <p className="text-sm text-muted-foreground">Gestão de Declarações de Imposto de Renda</p>
        </div>

        {/* Form */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-1">Entrar</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Acesse sua conta para continuar
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoComplete="username"
                  className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete="current-password"
                  className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? "Carregando..." : "Entrar"}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
