import React from 'react';
import { Bell, Info } from 'lucide-react';

const Tutorial = () => {
  return (
    <div className="space-y-6 animate-fade-in w-full max-w-4xl mx-auto pb-12 mt-12">
      <div className="glass-card rounded-2xl p-6 md:p-10 border-primary/20 shadow-[0_0_40px_hsl(var(--primary)/0.03)] mx-auto">
        <div className="flex items-center gap-5 mb-8">
          <div className="w-14 h-14 rounded-xl border border-primary/50 flex items-center justify-center bg-primary/10 text-primary shadow-inner">
            <Bell className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Como ativar notificacoes no celular</h1>
            <p className="text-sm text-muted-foreground mt-1">Receba alertas em tempo real sobre sua operacao</p>
          </div>
        </div>

        <p className="text-[15px] font-medium text-muted-foreground mb-8 leading-relaxed max-w-3xl">
          Para receber notificacoes no celular, instale o NytzerVision como app na tela inicial do seu aparelho. Depois, ao abrir o app, permita as notificacoes quando o sistema solicitar.
        </p>

        <div className="space-y-3">
          {[
            "Abra o NytzerVision no navegador do celular",
            "Toque no menu do navegador e selecione \"Adicionar a tela inicial\"",
            "Abra o app instalado na sua tela inicial",
            "Permita as notificacoes quando o aviso aparecer",
            "Se nao aparecer, ative manualmente nas configuracoes do navegador"
          ].map((text, i) => (
            <div key={i} className="flex items-center gap-5 p-5 rounded-[12px] border border-border/30 bg-background/40 hover:bg-muted/20 transition-all group">
              <div className="w-9 h-9 rounded-md shrink-0 bg-primary/5 border border-primary/20 flex items-center justify-center text-xs font-black text-primary group-hover:bg-primary/20 group-hover:border-primary/50 transition-colors">
                0{i + 1}
              </div>
              <p className="text-[14px] font-bold text-foreground/90">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 p-5 rounded-xl border border-primary/30 bg-primary/5 flex items-center gap-4 shadow-inner">
          <Info className="w-6 h-6 text-primary shrink-0" />
          <p className="text-sm font-semibold text-primary/90">
            As notificacoes ajudam voce a acompanhar atualizacoes importantes da operacao em tempo real.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;
