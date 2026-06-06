import React, { useEffect, useState } from 'react';
import { GraduationCap, BookOpen, Rocket, Network, Target, Wallet, Brain, Crown, ArrowRight, Bell, Info, Sparkles, CheckCircle2, Footprints } from 'lucide-react';
import { TasksHero, type HeroKpi } from '../components/heroes/TasksHero';
import { startTour, TOURS, getTourProgressPercent, TOUR_PROGRESS_EVENT } from '@/lib/tours';

interface Track {
  id: string;
  title: string;
  desc: string;
  icon: React.ComponentType<any>;
  level: 'Iniciante' | 'Intermediário' | 'Avançado';
}

const TRACKS: Track[] = [
  { id: 'primeiros', title: 'Primeiros Passos', desc: 'Configure sua operação e domine a interface central em minutos.', icon: Rocket, level: 'Iniciante' },
  { id: 'operacoes', title: 'Operações & Remessas', desc: 'Lance metas, registre remessas e domine o ciclo completo de uma operação.', icon: Sparkles, level: 'Iniciante' },
  { id: 'redes', title: 'Redes & Operadores', desc: 'Estruture sua rede, organize operadores e maximize a performance coletiva.', icon: Network, level: 'Intermediário' },
  { id: 'metas', title: 'Missões & Forecast', desc: 'Use o Central de Missões para escalar metas com previsão IA.', icon: Target, level: 'Intermediário' },
  { id: 'custos', title: 'Inteligência de Custos', desc: 'Controle custos, identifique vazamentos e maximize eficiência operacional.', icon: Wallet, level: 'Avançado' },
  { id: 'decision', title: 'Motor de Decisão IA', desc: 'Aprenda a interpretar os sinais do Motor de Decisão e agir com precisão.', icon: Brain, level: 'Avançado' },
  { id: 'assinatura', title: 'Plano & Acesso Premium', desc: 'Entenda as camadas de acesso, renovação e benefícios exclusivos.', icon: Crown, level: 'Iniciante' },
];

const LEVEL_TONE: Record<Track['level'], string> = {
  Iniciante: 'text-success bg-success/10 border-success/30',
  Intermediário: 'text-primary bg-primary/10 border-primary/30',
  Avançado: 'text-warning bg-warning/10 border-warning/30',
};

export default function Tutorial() {
  // Re-render when tour progress changes
  const [progressTick, setProgressTick] = useState(0);
  useEffect(() => {
    const bump = () => setProgressTick((n) => n + 1);
    window.addEventListener(TOUR_PROGRESS_EVENT, bump);
    window.addEventListener('storage', bump);
    return () => {
      window.removeEventListener(TOUR_PROGRESS_EVENT, bump);
      window.removeEventListener('storage', bump);
    };
  }, []);

  const enriched = TRACKS.map((t) => {
    const def = TOURS[t.id];
    const steps = def ? def.steps.length : 0;
    const progress = getTourProgressPercent(t.id);
    return { ...t, steps, progress };
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _tick = progressTick;

  const totalSteps = enriched.reduce((s, t) => s + t.steps, 0);
  const completedSteps = enriched.reduce(
    (s, t) => s + Math.round((t.steps * t.progress) / 100),
    0,
  );
  const conclusao = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in relative z-10 w-full text-foreground">
      <TasksHero
        eyebrow="Tutorial · Academia operacional"
        title="Trilhas de maestria"
        description="Domine cada módulo do sistema no seu ritmo. Trilhas guiadas, do básico ao avançado."
        pulseDotClass="bg-primary"
        progressLabel="Conclusão geral"
        progressValue={conclusao}
        kpis={[
          { label: 'Trilhas', value: String(enriched.length), accent: true },
          { label: 'Módulos', value: String(totalSteps) },
          { label: 'Conclusão', value: `${Math.round(conclusao)}%`, tone: conclusao >= 100 ? 'success' : 'default' },
          {
            label: 'Trilhas concluídas',
            value: String(enriched.filter((t: any) => t.progress === 100).length),
            tone: 'success',
          },
        ] as HeroKpi[]}
      />

      {/* Tracks grid */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-4 h-4 text-primary" />
          <h2 className="text-lg font-black tracking-tight text-foreground">Trilhas de Maestria</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {enriched.map(t => {
            const Icon = t.icon;
            const completed = t.progress === 100;
            const stepsDone = Math.round((t.steps * t.progress) / 100);
            return (
              <div key={t.id} className="surface-2 hairline-gold rounded-2xl p-5 group hover:border-primary/30 transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/[0.04] rounded-full blur-3xl pointer-events-none group-hover:bg-primary/[0.10] transition-all" />

                <div className="relative flex items-start justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${LEVEL_TONE[t.level]}`}>
                    {t.level}
                  </span>
                </div>

                <h3 className="text-base font-black text-foreground tracking-tight mb-1 relative">{t.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4 relative">{t.desc}</p>

                <div className="relative flex items-center gap-3 text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-3">
                  <span className="inline-flex items-center gap-1"><Footprints className="w-3 h-3" /> {t.steps} passos</span>
                  <span>· {stepsDone}/{t.steps} concluídos</span>
                </div>

                <div className="relative mb-3">
                  <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden border border-border/50">
                    <div
                      className={`h-full transition-all duration-1000 ${completed ? 'bg-success' : 'bg-primary'}`}
                      style={{ width: `${t.progress}%`, boxShadow: completed ? '0 0 8px hsl(var(--success)/0.5)' : '0 0 8px hsl(var(--primary)/0.4)' }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground">Progresso</span>
                    <span className={`text-[11px] font-black tabular-nums ${completed ? 'text-success' : 'text-primary'}`}>
                      {t.progress}%
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => startTour(t.id)}
                  className="relative w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-foreground/5 hover:bg-primary/10 hover:text-primary border border-border hover:border-primary/30 transition-all"
                >
                  {completed ? (<><CheckCircle2 className="w-3.5 h-3.5 text-success" /> Revisar trilha</>) : t.progress > 0 ? (<>Continuar trilha <ArrowRight className="w-3.5 h-3.5" /></>) : (<>Iniciar trilha <ArrowRight className="w-3.5 h-3.5" /></>)}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick start: notifications */}
      <div className="surface-2 hairline-gold rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-black text-foreground tracking-tight">Início Rápido · Notificações no celular</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Receba alertas em tempo real sobre sua operação.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            'Abra o NytzerVision no navegador do celular',
            'Toque no menu e selecione "Adicionar à tela inicial"',
            'Abra o app instalado pela tela inicial',
            'Permita as notificações quando o aviso aparecer',
            'Se não aparecer, ative manualmente nas configurações do navegador',
          ].map((text, i) => (
            <div key={i} className="surface-1 rounded-xl p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-md shrink-0 bg-primary/10 border border-primary/20 flex items-center justify-center text-[11px] font-black text-primary">
                {String(i + 1).padStart(2, '0')}
              </div>
              <p className="text-xs font-semibold text-foreground/90">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 p-4 rounded-xl surface-1 border-primary/25 flex items-center gap-3">
          <Info className="w-5 h-5 text-primary shrink-0" />
          <p className="text-xs font-semibold text-primary/90">
            As notificações aceleram sua capacidade de reagir e maximizam o aproveitamento das oportunidades operacionais.
          </p>
        </div>
      </div>
    </div>
  );
}
