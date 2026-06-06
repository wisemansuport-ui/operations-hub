import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, TrendingUp, ShieldAlert, CheckCircle2, AlertTriangle, Target, Loader2, RefreshCw, Brain, Trophy } from "lucide-react";

interface NetworkLike {
  id: string;
  name: string;
  rank: number;
  score: number;
  trend: string;
  metas: number;
  contas: number;
  winRate: number;
  roi: number;
  profitPerConta: number;
  totalDeposito: number;
  totalSaque: number;
  totalProfit: number;
  recommendationType: string;
  recommendationDetail: string;
}

interface Peers {
  length: number;
  avgRoi: number;
  avgWin: number;
  avgPpc: number;
  avgProfit: number;
}

interface Analysis {
  veredito?: string;
  pontosFortes?: string[];
  pontosFracos?: string[];
  acoes?: string[];
  comparativo?: string;
  riscos?: string[];
  previsao?: string;
}

interface Props {
  network: NetworkLike | null;
  peers: Peers | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const fBRL = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
const fPerc = (v: number) => `${v.toFixed(1)}%`;

export function NetworkInsightDialog({ network, peers, open, onOpenChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    if (!network) return;
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-network", {
        body: { network, peers },
      });
      if (error) throw new Error(error.message);
      if ((data as any)?.error) throw new Error((data as any).error);
      setAnalysis((data as any).analysis as Analysis);
    } catch (e: any) {
      setError(e?.message || "Falha ao gerar análise.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && network) runAnalysis();
    if (!open) { setAnalysis(null); setError(null); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, network?.id]);

  if (!network) return null;

  const profitPositive = network.totalProfit >= 0;
  const scoreColor =
    network.score >= 70 ? "text-primary border-primary/30 bg-primary/10" :
    network.score >= 40 ? "text-warning border-warning/30 bg-warning/10" :
    "text-destructive border-destructive/30 bg-destructive/10";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-12 h-12 rounded-xl border tabular-nums font-bold text-base ${scoreColor}`}>
              {network.score}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-bold tracking-tight">{network.name}</span>
                <span className="text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-md border border-primary/30 bg-primary/10 text-primary inline-flex items-center gap-1">
                  <Trophy className="w-3 h-3" /> Rank #{network.rank}
                </span>
              </div>
              <DialogDescription className="text-xs mt-0.5">
                Análise inteligente de performance · gerada por IA
              </DialogDescription>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-2">
          <KPI label="ROI" value={fPerc(network.roi)} tone={network.roi >= 0 ? "success" : "destructive"} />
          <KPI label="Win Rate" value={`${network.winRate}%`} tone="primary" />
          <KPI label="R$ / Conta" value={fBRL(network.profitPerConta)} />
          <KPI label="Lucro" value={`${profitPositive ? "+" : ""}${fBRL(network.totalProfit)}`} tone={profitPositive ? "success" : "destructive"} />
          <KPI label="Metas" value={String(network.metas)} />
          <KPI label="Contas" value={String(network.contas)} />
          <KPI label="Capital" value={fBRL(network.totalDeposito)} />
          <KPI label="Retorno" value={fBRL(network.totalSaque)} />
        </div>

        {/* Análise IA */}
        <div className="mt-4 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] to-transparent p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
                <Brain className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">Análise inteligente</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Gemini · contexto comparativo</p>
              </div>
            </div>
            <button
              onClick={runAnalysis}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1.5 rounded-md border border-border hover:border-primary/50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Reanalisar
            </button>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> A IA está estudando a rede...
            </div>
          )}

          {error && !loading && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-3">
              {error}
            </div>
          )}

          {analysis && !loading && (
            <div className="space-y-4">
              {analysis.veredito && (
                <div className="rounded-lg border border-primary/30 bg-primary/[0.08] p-3.5">
                  <p className="text-[10px] uppercase tracking-widest text-primary/80 font-semibold mb-1 flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Veredito</p>
                  <p className="text-sm text-foreground font-medium leading-relaxed">{analysis.veredito}</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-3">
                {analysis.pontosFortes?.length ? (
                  <InsightBlock icon={CheckCircle2} title="Pontos fortes" tone="success" items={analysis.pontosFortes} />
                ) : null}
                {analysis.pontosFracos?.length ? (
                  <InsightBlock icon={AlertTriangle} title="Pontos fracos" tone="warning" items={analysis.pontosFracos} />
                ) : null}
              </div>

              {analysis.comparativo && (
                <InsightText icon={TrendingUp} title="Comparativo com a média" body={analysis.comparativo} />
              )}

              {analysis.acoes?.length ? (
                <InsightBlock icon={Target} title="Ações recomendadas" tone="primary" items={analysis.acoes} numbered />
              ) : null}

              {analysis.riscos?.length ? (
                <InsightBlock icon={ShieldAlert} title="Riscos a observar" tone="destructive" items={analysis.riscos} />
              ) : null}

              {analysis.previsao && (
                <InsightText icon={Sparkles} title="Previsão" body={analysis.previsao} />
              )}
            </div>
          )}
        </div>

        {/* recomendação base do sistema */}
        <div className="mt-3 rounded-lg border border-border/60 bg-secondary/30 p-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Recomendação do score</p>
          <p className="text-xs text-foreground/90 leading-relaxed">{network.recommendationDetail}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function KPI({ label, value, tone }: { label: string; value: string; tone?: "success" | "destructive" | "primary" }) {
  const color =
    tone === "success" ? "text-success" :
    tone === "destructive" ? "text-destructive" :
    tone === "primary" ? "text-primary" : "text-foreground";
  return (
    <div className="rounded-lg border border-border/60 bg-card/60 px-3 py-2.5">
      <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">{label}</p>
      <p className={`text-sm font-bold tabular-nums mt-0.5 ${color}`}>{value}</p>
    </div>
  );
}

function InsightBlock({
  icon: Icon, title, items, tone, numbered,
}: { icon: any; title: string; items: string[]; tone: "success" | "warning" | "destructive" | "primary"; numbered?: boolean }) {
  const cls =
    tone === "success" ? "border-success/30 bg-success/5 text-success" :
    tone === "warning" ? "border-warning/30 bg-warning/5 text-warning" :
    tone === "destructive" ? "border-destructive/30 bg-destructive/5 text-destructive" :
    "border-primary/30 bg-primary/5 text-primary";
  return (
    <div className={`rounded-lg border p-3 ${cls.split(" ").slice(0, 2).join(" ")}`}>
      <p className={`text-[10px] uppercase tracking-widest font-semibold mb-2 flex items-center gap-1.5 ${cls.split(" ")[2]}`}>
        <Icon className="w-3 h-3" /> {title}
      </p>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="text-xs text-foreground/90 leading-relaxed flex gap-2">
            <span className={`shrink-0 ${cls.split(" ")[2]} font-bold`}>{numbered ? `${i + 1}.` : "·"}</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InsightText({ icon: Icon, title, body }: { icon: any; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
      <p className="text-[10px] uppercase tracking-widest font-semibold mb-1 flex items-center gap-1.5 text-muted-foreground">
        <Icon className="w-3 h-3" /> {title}
      </p>
      <p className="text-xs text-foreground/90 leading-relaxed">{body}</p>
    </div>
  );
}
