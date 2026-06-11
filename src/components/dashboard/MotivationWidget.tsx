import { useEffect, useState } from "react";
import { Quote, Sparkles } from "lucide-react";

const QUOTES: { text: string; author: string }[] = [
  { text: "Disciplina pesa gramas, arrependimento pesa toneladas.", author: "Jim Rohn" },
  { text: "O sucesso é a soma de pequenos esforços repetidos dia após dia.", author: "Robert Collier" },
  { text: "Não conte os dias, faça os dias contarem.", author: "Muhammad Ali" },
  { text: "Grandes coisas nunca vêm da zona de conforto.", author: "Roy T. Bennett" },
  { text: "A persistência realiza o impossível.", author: "Provérbio Chinês" },
  { text: "Você é o que você faz repetidamente. Excelência é um hábito.", author: "Aristóteles" },
  { text: "O preço do sucesso é trabalho duro e dedicação ao trabalho em mãos.", author: "Vince Lombardi" },
  { text: "Se você quer algo que nunca teve, faça algo que nunca fez.", author: "Thomas Jefferson" },
  { text: "A sorte favorece a mente preparada.", author: "Louis Pasteur" },
  { text: "Sonhe grande. Comece pequeno. Aja agora.", author: "Robin Sharma" },
  { text: "Não espere por oportunidades, crie-as.", author: "George Bernard Shaw" },
  { text: "Cada dia é uma nova chance de virar o jogo.", author: "Nytzervision" },
  { text: "Dinheiro segue valor. Construa valor antes de cobrar resultado.", author: "Naval Ravikant" },
  { text: "Foco vence talento quando talento não foca.", author: "Tim Notke" },
  { text: "Trabalhe enquanto eles dormem. Aprenda enquanto eles se divertem.", author: "Anônimo" },
];

const getDayIndex = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  return dayOfYear % QUOTES.length;
};

const ROTATE_MS = 60_000; // checa virada de dia a cada minuto

export const MotivationWidget = () => {
  const [idx, setIdx] = useState(getDayIndex);

  useEffect(() => {
    const id = setInterval(() => {
      setIdx(getDayIndex());
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, []);

  const q = QUOTES[idx];

  return (
    <div className="hairline-gold surface-3 rounded-2xl p-5 md:p-6 relative overflow-hidden group h-full flex flex-col min-h-[260px]">
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700" />
      <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />

      {/* Header */}
      <div className="flex items-center gap-2 relative z-10">
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-primary/80">Motivação Diária</p>
          <h3 className="text-sm font-bold text-foreground">Combustível para a operação</h3>
        </div>
      </div>

      {/* Quote — centered, fills space */}
      <div className="flex-1 flex flex-col justify-center relative z-10 py-6">
        <div key={idx} className="animate-fade-in">
          <Quote className="w-7 h-7 text-primary/40 mb-3" />
          <p className="text-lg md:text-xl font-semibold text-foreground leading-snug tracking-tight text-balance">
            {q.text}
          </p>
          <div className="flex items-center gap-3 mt-5">
            <div className="h-px flex-1 bg-gradient-to-r from-primary/40 to-transparent" />
            <span className="text-[11px] uppercase tracking-widest font-semibold text-primary/70 whitespace-nowrap">— {q.author}</span>
          </div>
        </div>
      </div>

      {/* Footer — frase do dia */}
      <div className="flex items-center justify-between relative z-10 pt-1">
        <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-primary/60">Frase do dia</span>
        <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground tabular-nums">
          {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
        </span>
      </div>
    </div>
  );
};
