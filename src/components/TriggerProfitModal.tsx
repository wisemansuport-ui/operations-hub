import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Send, CalendarDays, CalendarRange, CalendarClock, History, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

type Period = "daily" | "weekly" | "monthly" | "7d" | "30d";

const OPTS: { value: Period; label: string; sub: string; icon: any }[] = [
  { value: "daily",   label: "Hoje (diário)",     sub: "Fechamento do Dia",         icon: CalendarDays },
  { value: "weekly",  label: "Esta semana",        sub: "Fechamento Semanal",        icon: CalendarRange },
  { value: "monthly", label: "Este mês",           sub: "Fechamento Mensal + Meta",  icon: CalendarClock },
  { value: "7d",      label: "Últimos 7 dias",     sub: "Janela móvel 7d",           icon: History },
  { value: "30d",     label: "Últimos 30 dias",    sub: "Janela móvel 30d + Meta",   icon: Calendar },
];

const friendlyTriggerError = (message?: string) => {
  const text = message || "Serviço temporariamente indisponível.";
  if (/firestore|quota|limite/i.test(text)) {
    return "Lucro ainda não sincronizado no banco. Aguarde a próxima atualização automática e tente novamente.";
  }
  return text;
};

export const TriggerProfitModal = ({ open, onOpenChange }: Props) => {
  const [user] = useLocalStorage<any>("nytzer-user", null);
  const [period, setPeriod] = useState<Period>("daily");
  const [firing, setFiring] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const handleFire = async () => {
    if (!user?.username) {
      toast.error("Sem usuário logado.");
      return;
    }
    setFiring(true);
    setLastResult(null);
    const tId = toast.loading("Disparando notificação...");
    try {
      const { data, error } = await supabase.functions.invoke("send-profit-summary", {
        body: { period, targetAdmin: user.username, allowZero: true },
      });
      toast.dismiss(tId);

      if (error) {
        console.error("[trigger] invoke error", error);
        toast.error("Falha ao disparar: " + (error.message || "erro desconhecido"));
        setLastResult("❌ " + (error.message || "erro"));
        return;
      }

      const d: any = data || {};
      if (d.fallback) {
        const message = friendlyTriggerError(d.error);
        toast.warning(message);
        setLastResult("⚠️ " + message);
        return;
      }

      const results: any[] = Array.isArray(d.results) ? d.results : [];
      const count = d.count ?? results.length;
      const sent = results.filter(r => r.status >= 200 && r.status < 300).length;

      if (count === 0) {
        toast.info("Nenhum admin alvo encontrado.");
        setLastResult("ℹ️ Nenhum envio");
      } else if (sent === 0) {
        toast.error("Função executou mas push falhou. Veja logs.");
        setLastResult("❌ Push falhou em todos os alvos");
      } else {
        toast.success(`✅ Notificação enviada! (${sent}/${count})`);
        const me = results.find(r => r.admin === user.username);
        if (me) {
          const v = typeof me.total === "number" ? me.total : 0;
          const sign = v >= 0 ? "+" : "-";
          const abs = Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          setLastResult(`✅ Lucro do período: ${sign}R$ ${abs}`);
        } else {
          setLastResult(`✅ ${sent}/${count} enviado(s)`);
        }
      }
    } catch (e: any) {
      toast.dismiss(tId);
      console.error("[trigger] catch", e);
      toast.error("Falha ao disparar: " + (e?.message || e));
      setLastResult("❌ " + (e?.message || String(e)));
    } finally {
      setFiring(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0a0a0a]/95 border-primary/20 max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Send className="w-5 h-5" /> Disparo de Lucro
          </DialogTitle>
          <DialogDescription>
            Calcula o lucro do período (horário de Brasília) e envia o push + alerta no sino para a sua conta admin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 pt-2">
          {OPTS.map(opt => {
            const Icon = opt.icon;
            const active = period === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                  active
                    ? "bg-primary/15 border-primary/60 text-primary shadow-md shadow-primary/10"
                    : "bg-black/30 border-primary/15 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${active ? "text-primary" : ""}`} />
                <div className="flex-1">
                  <div className="text-sm font-semibold">{opt.label}</div>
                  <div className="text-[11px] opacity-70">{opt.sub}</div>
                </div>
                <div className={`w-3 h-3 rounded-full border-2 ${active ? "border-primary bg-primary" : "border-muted-foreground/30"}`} />
              </button>
            );
          })}
        </div>

        {lastResult && (
          <div className="text-xs px-3 py-2 rounded-lg bg-black/40 border border-primary/15 text-muted-foreground">
            {lastResult}
          </div>
        )}

        <Button
          onClick={handleFire}
          disabled={firing}
          className="bg-primary text-primary-foreground hover:bg-primary/90 w-full h-11 text-base"
        >
          {firing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />}
          {firing ? "Disparando..." : "Disparar agora"}
        </Button>

        <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
          Tom de voz aplicado automaticamente conforme o resultado (motivacional negativo / até R$ 500 / até R$ 1.500 / acima).
          Mensal e 30d incluem o % da sua meta mensal.
        </p>
      </DialogContent>
    </Dialog>
  );
};
