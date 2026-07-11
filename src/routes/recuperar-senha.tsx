import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/recuperar-senha")({
  head: () => ({ meta: [{ title: "Recuperar senha — WF Digital CRM" }] }),
  component: RecoverPage,
});

function RecoverPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Sempre exibir mesma resposta — proteção contra enumeração de e-mail.
    setSent(true);
    toast.success("Se o e-mail existir, enviaremos as instruções.");
  }

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <div className="w-full max-w-[420px]">
        <Link to="/login" className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Voltar ao login
        </Link>
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h1 className="text-lg font-semibold">Recuperar senha</h1>
          <p className="text-[13px] text-muted-foreground mt-1 mb-4">
            Informe seu e-mail corporativo e enviaremos as instruções.
          </p>
          {sent ? (
            <div className="text-[13px] bg-primary-soft/40 border border-primary/20 rounded-lg p-3 text-primary-strong">
              Se o e-mail existir, você receberá as instruções em instantes.
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@empresa.com.br"
                  className="w-full h-11 pl-10 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary-strong">
                Enviar instruções
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
