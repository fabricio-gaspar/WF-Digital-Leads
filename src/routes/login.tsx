import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Lock, Mail, Loader2 } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { toast } from "sonner";
import { stores } from "@/repositories/demo";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — WF Digital CRM" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { session, signIn } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) nav({ to: session.user.role === "atendente" ? "/portal" : "/dashboard" });
  }, [session, nav]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    const r = await signIn(email, password);
    setLoading(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    toast.success("Bem-vindo(a) ao WF Digital CRM");
  }

  const demoUsers = stores.users.list();

  return (
    <div className="min-h-screen w-full grid place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-6">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-primary text-primary-foreground grid place-items-center text-lg font-bold shadow-sm">WF</div>
          <h1 className="mt-4 text-2xl font-semibold text-foreground">WF Digital CRM</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Prospecção B2B e pipeline de vendas</p>
        </div>

        <form onSubmit={onSubmit} className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <label htmlFor="email" className="block text-[13px] font-medium text-foreground mb-1.5">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@empresa.com.br"
                className="w-full h-11 pl-10 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="block text-[13px] font-medium text-foreground mb-1.5">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="password"
                type={showPass ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                className="w-full h-11 pl-10 pr-10 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground rounded"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="mt-1.5 text-right">
              <Link to="/recuperar-senha" className="text-[12px] text-primary hover:underline">Esqueci minha senha</Link>
            </div>
          </div>
          {error && (
            <div role="alert" className="text-[13px] text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary-strong transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Entrar no CRM
          </button>

          <details open className="text-[12px] text-muted-foreground border-t border-border pt-3 mt-3">
            <summary className="cursor-pointer hover:text-foreground font-medium">Usuários de demonstração (clique para preencher)</summary>
            <div className="mt-2 space-y-1">
              <p>Senha para todos: <code className="bg-muted px-1.5 py-0.5 rounded">demo123</code></p>
              {demoUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => { setEmail(u.email); setPassword("demo123"); }}
                  className="w-full text-left hover:bg-muted rounded px-1.5 py-1.5 flex flex-col gap-0.5 border border-transparent hover:border-border"
                >
                  <span className="flex justify-between items-center">
                    <span className="font-medium text-foreground">{u.name}</span>
                    <span className="capitalize text-primary text-[11px]">{u.role}</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground">{u.email}</span>
                </button>
              ))}
            </div>
          </details>
        </form>

        <p className="text-center text-[12px] text-muted-foreground mt-4">
          Acesso restrito ao time comercial. Sessão expira em 8 horas.
        </p>
      </div>
    </div>
  );
}
